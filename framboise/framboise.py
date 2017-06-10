#!/usr/bin/env python3
# coding: utf-8
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
import argparse
import logging
import multiprocessing
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import json
from libs.py import websocket

try:
    # Python 3
    from queue import Queue, Empty
    from urllib.parse import urlencode, urljoin, unquote
    from socketserver import TCPServer
    from urllib.request import pathname2url
except ImportError as e:
    # Python 2
    from Queue import Queue, Empty
    from urllib import urlencode
    from urlparse import unquote, urljoin
    from SocketServer import TCPServer
    from urllib import pathname2url
try:
    import yaml
except ImportError as e:
    print('Run: pip install PyYAML')
    sys.exit(1)


VERSION = "17.03.14"
ROOT = os.path.dirname(os.path.abspath(__file__))


class MonitorException(Exception):
    """
    Unrecoverable error in external process.
    """
    pass


class FramboiseException(Exception):
    """
    Unrecoverable error in framboise.
    """
    pass


class PluginException(Exception):
    """
    Unrecoverable error in external process.
    """
    pass


class Listener(object):
    """
    An abstract class for providing base methods and properties to listeners.
    """

    @classmethod
    def name(cls):
        return getattr(cls, 'LISTENER_NAME', cls.__name__)

    def process_line(self, line):
        pass

    def detected_fault(self):
        return False

    def get_data(self, bucket):
        pass


class TestcaseListener(Listener):

    LISTENER_NAME = 'TestcaseListener'

    def __init__(self, *args):
        super(TestcaseListener, self).__init__(*args)
        self.testcase = []

    def process_line(self, line):
        if line.find('NEXT TESTCASE') != -1:
            self.testcase = []
        if line.startswith('/*L*/'):
            self.testcase.append(json.loads(line[5:]))

    def detected_fault(self):
        return True

    def get_data(self, bucket):
        if self.testcase:
            bucket['testcase'] = {
                'data': os.linesep.join(self.testcase),
                'name': 'testcase.txt'
            }


class AsanListener(Listener):

    LISTENER_NAME = 'AsanListener'

    def __init__(self, *args):
        super(AsanListener, self).__init__(*args)
        self.crashlog = []
        self.failure = False

    def process_line(self, line):
        if line.find('ERROR: AddressSanitizer') != -1:
            self.failure = True
        if self.failure:
            self.crashlog.append(line)

    def detected_fault(self):
        return self.failure

    def get_data(self, bucket):
        if self.crashlog:
            bucket['crashlog'] = {
                'data': os.linesep.join(self.crashlog),
                'name': 'crashlog.txt'
            }


class SyzyListener(Listener):

    LISTENER = 'SyzyAsanListener'

    def __init__(self, *args):
        super(SyzyListener, self).__init__(*args)
        self.crashlog = []
        self.failure = False

    def process_line(self, line):
        if line.find('SyzyASAN error:') != -1:
            self.failure = True
        if self.failure:
            self.crashlog.append(line)

    def detected_fault(self):
        return self.failure

    def get_data(self, bucket):
        if self.crashlog:
            bucket['crashlog'] = {
                'data': os.linesep.join(self.crashlog),
                'name': 'crashlog.txt'
            }


class Monitor(threading.Thread):
    """
    An abstract class for providing base methods and properties to monitors.
    """

    def __init__(self, verbose=False):
        super(Monitor, self).__init__()
        self.verbose = verbose
        self.listeners = []
        self.line_queue = Queue()

    @classmethod
    def name(cls):
        return getattr(cls, 'MONITOR_NAME', cls.__name__)

    def run(self):
        line_consumer = threading.Thread(target=self.enqueue_lines)
        line_consumer.daemon = True
        line_consumer.start()

        while True:
            try:
                line = self.line_queue.get_nowait()
            except Empty:
                time.sleep(0.01)
                continue

            line = line.strip()

            if self.verbose:
                print(line)

            for listener in self.listeners:
                listener.process_line(line)

    def enqueue_lines(self):
        pass

    def stop(self):
        pass

    def add_listener(self, listener):
        assert isinstance(listener, Listener)
        self.listeners.append(listener)

    def detected_fault(self):
        return any(listener.detected_fault() for listener in self.listeners)

    def get_data(self):
        bucket = {}
        for listener in self.listeners:
            listener.get_data(bucket)
        return bucket


class ConsoleMonitor(Monitor):

    MONITOR_NAME = 'ConsoleMonitor'

    def __init__(self, process, *args, **kwargs):
        super(ConsoleMonitor, self).__init__(*args, **kwargs)
        self.out = process.stdout

    def enqueue_lines(self):
        for line in iter(self.out.readline, ''):
            self.line_queue.put(line)
        self.out.close()


class WebSocketMonitor(Monitor):

    MONITOR_NAME = 'WebSocketMonitor'

    def __init__(self, addr_port=('', 9999), *args, **kwargs):
        super(WebSocketMonitor, self).__init__(*args, **kwargs)
        self.addr_port = addr_port
        self.server = None

    def enqueue_lines(self):
        run = True
        line_queue = self.line_queue

        class WebSocketHandler(websocket.BaseWebSocketHandler):
            def on_message(self, message):
                line_queue.put(message)

            def should_close(self):
                return not run

        class _TCPServer(TCPServer):
            allow_reuse_address = True

        self.server = _TCPServer(self.addr_port, WebSocketHandler)
        try:
            self.server.serve_forever()
        finally:
            run = False

    def stop(self):
        if self.server:
            try:
                self.server.shutdown()
            except Exception as e:
                logging.exception(e)


class BasePlugin(object):
    """
    An abstract class for providing base methods and properties to plugins.
    """

    @classmethod
    def name(cls):
        return getattr(cls, 'PLUGIN_NAME', cls.__name__)

    @classmethod
    def version(cls):
        return getattr(cls, 'PLUGIN_VERSION', '0.1')

    def open(self, *args):
        pass

    def stop(self):
        pass


class ExternalProcess(BasePlugin):
    """
    Parent class for plugins which make use of external tools.
    """

    def __init__(self):
        self.process = None

    @staticmethod
    def which(program_name):
        for path in os.getenv('PATH').split(os.pathsep):
            program_path = os.path.join(path, program_name)
            if os.path.isfile(program_path) and \
                    os.access(program_path, os.X_OK):
                return program_path

    def open(self, cmd, env=None, cwd=None):
        logging.info('Running command: {}'.format(cmd))
        if env is None:
            env = os.environ
        self.process = subprocess.Popen(
            cmd,
            universal_newlines=True,
            env=env,
            cwd=cwd,
            stderr=subprocess.STDOUT,
            stdout=subprocess.PIPE,
            bufsize=1,
            close_fds='posix' in sys.builtin_module_names)
        return self.process

    @staticmethod
    def call(cmd, env=None, cwd=None):
        logging.info('Calling command: {}'.format(cmd))
        return subprocess.check_call(cmd, env=env, cwd=cwd)

    def wait(self, timeout=600):
        if timeout:
            end_time = time.time() + timeout
            interval = min(timeout / 1000.0, .25)
            while True:
                result = self.process.poll()
                if result is not None:
                    return result
                if time.time() >= end_time:
                    break
                time.sleep(interval)
            self.stop()
        self.process.wait()

    @staticmethod
    def setup_environ(context=None):
        env = os.environ
        if context is None:
            return env
        for key, val in context.items():
            if isinstance(val, dict):
                env[key] = ' '.join('{!s}={!r}'.format(k, v) for (k, v) in val.items())
            else:
                env[key] = val
        return env

    def stop(self):
        if self.process:
            try:
                self.process.terminate()
                self.process.kill()
            except Exception as e:
                logging.error(e)

    def build_path(self, path):
        return os.path.expandvars(os.path.expanduser(path))

    def build_args(self, args):
        return os.path.expandvars(args)


class DefaultPlugin(ExternalProcess):

    PLUGIN_NAME = 'Default'

    def start(self):
        application = self.build_path(self.configuration['application'])
        if not application or not os.path.exists(application):
            raise PluginException('{} not found.'.format(application))
        arguments = self.build_args(self.configuration['arguments'])
        environment = self.configuration['environment']

        cmd = [application]
        if arguments:
            cmd.extend(arguments)
        cmd.append(self.target)
        self.process = self.open(cmd, self.setup_environ(environment))


class FirefoxPlugin(ExternalProcess):

    PLUGIN_NAME = 'Firefox'

    def __init__(self):
        super(FirefoxPlugin, self).__init__()
        self.profile_folder = ''

    def start(self):
        application = self.build_path(self.configuration['application'])
        if not application or not os.path.exists(application):
            raise PluginException('{} not found.'.format(application))
        arguments = self.build_args(self.configuration['arguments'])
        environment = self.configuration['environment']
        preferences = self.build_path(self.configuration['preferences'])
        if not preferences or not os.path.exists(preferences):
            raise PluginException('{} not found.'.format(preferences))

        self.profile_folder = tempfile.mkdtemp()
        profile_name = os.path.basename(self.profile_folder)
        cmd = [
            application,
            '-no-remote',
            '-CreateProfile',
            '{} {}'.format(profile_name, self.profile_folder)
        ]
        self.call(cmd, self.setup_environ(environment))
        shutil.copyfile(preferences, os.path.join(self.profile_folder, 'user.js'))

        cmd = [application, '-P', profile_name]
        cmd.extend(arguments.split())
        cmd.append(self.target)
        self.process = self.open(cmd, self.setup_environ(environment))

    def stop(self):
        if os.path.isdir(self.profile_folder):
            try:
                shutil.rmtree(self.profile_folder)
            except Exception as e:
                logging.exception(e)
        if self.process:
            try:
                self.process.terminate()
                self.process.kill()
            except Exception as e:
                logging.error(e)


class IexplorerPlugin(ExternalProcess):

    PLUGIN_NAME = "Internet Explorer"

    def start(self):
        application = self.build_path(self.configuration['application'])
        if not application or not os.path.exists(application):
            raise PluginException('{} not found.'.format(application))
        arguments = self.build_args(self.configuration['arguments'])
        environment = self.configuration['environment']

        self.call([
            'regedit', '/s',
            os.path.normpath('settings/iexplorer/enable-active-content.reg')])

        cmd = [application]
        if arguments:
            cmd.extend(arguments)
        cmd.append(self.target)
        self.process = self.open(cmd, self.setup_environ(environment))


class Logger(object):
    """
    Parent class for collecting buckets.
    """

    def __init__(self):
        self.bucket = {}

    def add_to_bucket(self, data):
        self.bucket.update(data)

    def add_fault(self):
        pass

    def build_path(self, path):
        return os.path.expandvars(os.path.expanduser(path))

    def build_args(self, args):
        return os.path.expandvars(args)


class FuzzManagerLogger(Logger):
    """
    Bucket class to send crash information to FuzzManager
    """

    def __init__(self, **kwargs):
        super(FuzzManagerLogger, self).__init__()
        self.__dict__.update(kwargs)

    def add_fault(self):
        testcase = crashdata = ""
        logdir = tempfile.TemporaryDirectory()

        for name, meta in self.bucket.items():
            if 'data' not in meta or not meta['data']:
                logging.error('Bucket "{}" does not contain "data" field or field is empty.'.format(name))
                continue
            if 'name' not in meta or not meta['name']:
                logging.error('Bucket "{}" does not contain "name" field or field is empty.'.format(name))
                continue

            filename = os.path.join(logdir.name, meta['name'])

            try:
                with open(filename, 'wb') as fo:
                    fo.write(meta['data'].encode('UTF-8'))
            except IOError as e:
                logging.exception(e)

            if "testcase.txt" in filename:
                testcase = filename
            if "crashlog.txt" in filename:
                crashdata = filename

        command = [
            "python", self.collector_script,
            "--tool", "framboise",
            "--submit",
            "--binary", self.binary]

        if crashdata:
            command += ["--crashdata", crashdata]
        if testcase:
            command += ["--testcase", testcase]

        print("Sending to FuzzManager: {}".format(command))

        try:
            subprocess.call(command)
        except Exception as e:
            logging.exception(e)
        else:
            logdir.cleanup()


class FilesystemLogger(Logger):
    """
    Bucket class to save crash information to disk.
    """

    BUCKET_ID = 'framboise_{}'.format(time.strftime('%a_%b_%d_%H-%M-%S_%Y'))

    def __init__(self, **kwargs):
        super(FilesystemLogger, self).__init__()
        self.__dict__.update(kwargs)
        self.bucketpath = os.path.join(self.build_path(self.path), self.BUCKET_ID)
        self.faultspath = os.path.join(self.bucketpath, 'faults')
        if not self.bucketpath:
            try:
                os.makedirs(self.bucketpath)
            except OSError as e:
                logging.exception(e)

    def add_fault(self):
        faultpath = os.path.join(self.faultspath, str(self.faults))
        try:
            os.makedirs(faultpath)
        except OSError as e:
            logging.exception(e)
            return
        for name, meta in self.bucket.items():
            if 'data' not in meta or not meta['data']:
                logging.error('Bucket "{}" does not contain "data" field or field is empty.'.format(name))
                continue
            if 'name' not in meta or not meta['name']:
                logging.error('Bucket "{}" does not contain "name" field or field is empty.'.format(name))
                continue
            filename = os.path.join(faultpath, meta['name'])
            try:
                with open(filename, 'wb') as fo:
                    fo.write(meta['data'].encode('UTF-8'))
            except IOError as e:
                logging.exception(e)

    @property
    def faults(self):
        count = 0
        if not os.path.exists(self.faultspath):
            return count
        for item in os.listdir(self.faultspath):
            item = os.path.join(self.faultspath, item)
            if os.path.isdir(item) and not item.startswith('.'):
                count += 1
        return count


class PluginRunner(object):

    def __init__(self, plugin, plugin_configuration, target):
        self.plugin = plugin()
        self.plugin.configuration = plugin_configuration
        self.plugin.target = target

    def start(self):
        self.plugin.start()

    def stop(self):
        self.plugin.stop()


class Framboise(object):

    def __init__(self):
        self.verbose = False
        self.config = None
        self.runner = None
        self.monitors = []
        self.loggers = []

    def load(self, config_path):
        with open(config_path) as fo:
            try:
                self.config = yaml.load(fo.read())
            except yaml.YAMLError as e:
                logging.error(e)
                raise IOError

    @property
    def modules(self):
        m = []
        for n in os.listdir(os.path.join(ROOT, 'modules')):
            if n.startswith('.'):
                continue
            m.append(n)
        return m

    def set_fuzzer(self, args):
        config = self.config['targets'][args.target]['setups'][args.setup]
        if args.ws_port is not None:
            config['websocket_port'] = args.ws_port
        elif 'websocket_port' not in config:
            config['websocket_port'] = 0
        if args.fuzzer:
            params = urlencode({
                'fuzzer': args.fuzzer,
                'timeout': args.timeout,
                'max-commands': args.max_commands,
                'seed': args.random_seed,
                'debug': args.debug,
                'with-set-timeout': args.with_set_timeout,
                'with-set-interval': args.with_set_interval,
                'with-events': args.with_events,
                'ws-logger': config['websocket_port'],
            })
            pathname = os.path.join(ROOT, urljoin('index.html', '?' + params))
            if sys.platform == "win32":
                fuzzer = unquote('file:' + pathname2url(pathname))
            else:
                fuzzer = unquote('file://' + pathname)
        if args.testcase:
            fuzzer = args.testcase
        if args.launch:
            fuzzer = ''
        return fuzzer

    def start(self, target, setup, fuzzer):
        plugin = self.get_plugin_class(target)
        plugin_config = self.config['targets'][target]['setups'][setup]

        self.runner = PluginRunner(plugin, plugin_config, target=fuzzer)
        self.runner.start()

        self._handle_monitors(plugin_config)
        self._handle_loggers(plugin_config)

        self.runner.plugin.wait(self.config['default']['process_timeout'])

        logging.info('Exit code: {}'.format(self.runner.plugin.process.returncode))

        if self.runner.plugin.process.returncode != 0:
            self._check_for_faults()

    @staticmethod
    def get_plugin_class(name):
        classname = name.title() + 'Plugin'
        if classname not in globals():
            logging.warning('No plugin for target "{}".'.format(name))
            classname = 'DefaultPlugin'
        return globals()[classname]

    def _check_for_faults(self):
        for monitor in self.monitors:
            if monitor.detected_fault():
                monitor_data = monitor.get_data()
                for logger in self.loggers:
                    logger.add_to_bucket(monitor_data)
        for logger in self.loggers:
            logger.add_fault()

    def _handle_loggers(self, config):
        self.loggers = []
        loggers = config['buckets']
        for classname, kwargs in loggers.items():
            if classname not in globals():
                continue
            try:
                logger = globals()[classname](**kwargs)
            except Exception as e:
                logging.error(e)
                continue
            self.loggers.append(logger)
            logging.info("Logger {} initialized.".format(classname))

    def _handle_monitors(self, config):
        self.monitors = []
        if 'monitors' not in config:
            config['monitors'] = ['console', 'testcase', 'asan']
        if isinstance(config['monitors'][0], str):
            config['monitors'] = [config['monitors']]
        for monitor_set in config['monitors']:
            root = monitor_set[0]
            listeners = monitor_set[1:]
            assert listeners
            if root == 'console':
                monitor = ConsoleMonitor(process=self.runner.plugin.process, verbose=self.verbose)
            elif root == 'websocket':
                monitor = WebSocketMonitor(addr_port=('', config['websocket_port']), verbose=self.verbose)
            else:
                raise Exception('Unknown monitor type: {}'.format(root))
            for l in listeners:
                listener_name = l.title() + 'Listener'
                if listener_name not in globals():
                    raise Exception('Unknown listener type: {}'.format(l))
                monitor.add_listener(globals()[listener_name]())
            monitor.daemon = True
            monitor.start()
            self.monitors.append(monitor)

    def stop(self):
        for monitor in self.monitors:
            monitor.stop()
        if self.runner:
            self.runner.stop()


def main(args):
    logging.basicConfig(
        format='[Framboise] %(asctime)s %(levelname)s: %(message)s',
        level=logging.DEBUG)

    framboise = Framboise()
    framboise.verbose = args.debug

    if args.list_modules:
        print(framboise.modules)
        sys.exit(0)

    if not any((args.fuzzer, args.testcase, args.launch)):
        logging.error('No further actions provided.')
        sys.exit(1)

    try:
        framboise.load(args.settings)
    except IOError as e:
        logging.error('Unable to read configuration file.')
        sys.exit(1)

    if args.target not in framboise.config.get('targets'):
        logging.error('"{}" is not defined in "{}".'.format(args.target, args.settings))
        sys.exit(1)

    if args.setup not in framboise.config['targets'][args.target]['setups']:
        logging.error('Setup "{}" is not defined in target "{}"'.format(args.setup, args.target))
        sys.exit(1)

    fuzzer = framboise.set_fuzzer(args)

    while True:
        try:
            framboise.start(args.target, args.setup, fuzzer)
            if args.restart:
                continue
            break
        except KeyboardInterrupt:
            raise Exception('Caught SIGINT, aborting.')
        except Exception as e:
            logging.error(e)
        finally:
            logging.info('Stopping Framboise.')
            framboise.stop()
            if not args.restart:
                break


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Framboise Client',
        prefix_chars='-',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    #
    # Flags: Client
    #
    parser.add_argument('-fuzzer', dest='fuzzer', metavar='list',
                        help='syntax: weighting:module [,...]')
    parser.add_argument('-target', dest='target', metavar='name', default='firefox',
                        help='target application')
    parser.add_argument('-setup', dest='setup',  metavar='name', default='default',
                        help='target environment')
    parser.add_argument('-worker', dest='worker', metavar='#', type=int, default=1,
                        help='number of worker instances')
    parser.add_argument('-testcase', dest='testcase', metavar='file',
                        help='open target app with provided testcase')
    parser.add_argument('-launch', dest='launch', action='store_true', default=False,
                        help='launch the target app only')
    parser.add_argument('-restart', dest='restart', action='store_true', default=False,
                        help='restart crashed worker')
    parser.add_argument('-timeout', dest='timeout', metavar='#', type=int, default=0,
                        help='timeout for reload')
    parser.add_argument('-websocket-port', dest='ws_port', metavar='#', type=int,
                        help='WebSocket monitor port')
    parser.add_argument('-update', dest='update', metavar='name',
                        help='run update script for target')
    parser.add_argument('-list', dest='list_modules', action='store_true', default=False,
                        help='show a list of available modules')
    parser.add_argument('-settings', dest='settings', metavar='file',
                        default='settings/framboise.{}.yaml'.format(sys.platform),
                        help='custom settings file')
    #
    # Flags: Fuzzers
    #
    parser.add_argument('-debug', dest='debug', action='store_true', default=False,
                        help='print out JS errors')
    parser.add_argument('-max-commands', dest='max_commands', metavar='#', type=int, default=100,
                        help='maximum amount of commands')
    parser.add_argument('-random-seed', dest='random_seed', metavar='#', default=None,
                        help='seed used for the PRNG')
    parser.add_argument('-with-set-timeout', dest='with_set_timeout', action='store_true', default=False,
                        help='make use of setTimeout()')
    parser.add_argument('-with-set-interval', dest='with_set_interval', action='store_true', default=False,
                        help='make use of setInterval()')
    parser.add_argument('-with-events', dest='with_events', action='store_true', default=False,
                        help='make use of addEventListener()')

    parser.add_argument('-version', action='version', version='%(prog)s {}'.format(VERSION))

    args = parser.parse_args()

    for _ in range(args.worker):
        p = multiprocessing.Process(target=main, args=(args,))
        p.start()
        time.sleep(3)
