#!/usr/bin/env python
# coding: utf-8
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
import os
import pip
try:
    from urllib import urlretrieve
except ImportError as e:
    from urllib.request import urlretrieve


def download(url, path):
    if not os.path.isdir(path):
        os.makedirs(path)
    urlretrieve(url, os.path.join(path, os.path.basename(url)))

def install(package):
    pip.main(['install', package, '--upgrade'])


if __name__ == "__main__":

    download('https://raw.githubusercontent.com/mozillasecurity/fuzzdata/master/settings/firefox/prefs.js', 'settings/firefox/')
    download('https://raw.githubusercontent.com/MozillaSecurity/fuzzdata/master/settings/fxos/user.js', 'settings/fxos/')
    download('https://raw.githubusercontent.com/MozillaSecurity/fuzzdata/master/settings/iexplorer/enable-active-content.reg', 'settings/iexplorer/')

    install("PyYAML==3.12")
