#!/usr/bin/env python
# coding: utf-8
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
import os, sys, logging
import time
import atexit
import argparse
try:
    import mozhttpd
    import moznetwork
    import mozprofile
    import mozrunner
    import mozdevice
    from mozdevice.devicemanager import NetworkTools
except ImportError as e:
    print("mozbase is missing.")
    sys.exit(-1)
try:
    import marionette
except ImportError as e:
    print("marionette is missing.")
    sys.exit(-1)    
try:
    import gaiatest
except ImportError as e:
    print("gaiatest is missing.")
    sys.exit(-1)


logging.basicConfig(format='[FirefoxOS] %(asctime)s %(levelname)s: %(message)s', level=logging.DEBUG)

curdir = os.path.dirname(os.path.abspath(__file__))
server = None

@atexit.register
def onExit():
    if server:
        logging.info("Closing mozhttpd socket.")
        server.stop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='FxOS Browser Navigator', prefix_chars='-')
    parser.add_argument('-b2g_dir', dest='b2g_dir', type=str, default="/Users/cdiehl/dev/repos/mozilla/b2g_emulator/", help='emulator b2g_dir')
    parser.add_argument('-symbols_path', dest='symbols_path', type=str, default="/Users/cdiehl/dev/repos/mozilla/b2g_emulator/out/target/product/generic/symbols")
    parser.add_argument('-logcat_dir', dest='logcat_dir', type=str, default="/Users/cdiehl/Desktop/")
    parser.add_argument('-prefs', dest='prefs', type=str, default="settings/fxos/user.js", help='gecko preference file')
    parser.add_argument('-fuzzer', dest='fuzzer', type=str, help='fuzzer')
    parser.add_argument('-root', dest='root', type=str, help='root directory of framboise')
    args = parser.parse_args()

    os.chdir(args.root)

    host = moznetwork.get_ip()
    port = NetworkTools().findOpenPort(host, 8000)
    args.url = "http://%s:%d/%s" % (host, port, args.fuzzer)

    # Setup HTTPd
    server = mozhttpd.MozHttpd(port=port, host=host, docroot=args.root)
    server.start()

    # Setup B2G and Firefox preferences
    pref = mozprofile.Preferences()
    pref.add(pref.read_prefs(args.prefs))
    profile = mozprofile.Profile(preferences=pref()) # Bug 908793

    # Setup Marionette
    marionette = marionette.Marionette(emulator='arm',
                                       homedir=args.b2g_dir,
                                       symbols_path=args.symbols_path,
                                       gecko_path=None,
                                       #logcat_dir=args.logcat_dir
                                      )

    # Setup DeviceManager for ADB
    device = mozdevice.DeviceManagerADB(loglevel=10)
    
    # Setup B2G with profile and marionette over ADB
    runner = mozrunner.B2GRunner(profile, device, marionette, context_chrome=False)
    runner.start()
    
    # Setup Gaia
    marionette.switch_to_frame()
    time.sleep(5)
    lock = gaiatest.LockScreen(marionette)
    lock.unlock()

    # Setup Firefox
    apps = gaiatest.GaiaApps(marionette)
    apps.launch('browser', switch_to_frame=True)
    marionette.execute_script("return window.wrappedJSObject.Browser.navigate('%s')" % args.url)

    # Handle logging
    while 1:
        logcat = device.getLogcat()
        if len(logcat) >= 1000:
            with open("/Users/cdiehl/Desktop/logcat.txt", "w") as fo:
                fo.write("".join(logcat))
            logcat = []
            device.recordLogcat()
        if marionette.check_for_crash():
            logging.error("Crash detected!")
            sys.exit(0)
        time.sleep(5)

