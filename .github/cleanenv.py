#!/usr/bin/env python3

import os
import sys

from subprocess import run, CalledProcessError

if __name__ == '__main__':
	cmd = sys.argv[1:]
	if not cmd:
		print('cleanenv: no command', file = sys.stderr, flush = True)
		sys.exit(1)
	env = {}
	for k, v in os.environ.items():
		if k == 'LS_COLORS':
			continue
		elif k.startswith('XDG_'):
			continue
		elif k.startswith('SSH_'):
			continue
		elif k.startswith('GITHUB_'):
			continue
		elif k.startswith('RUNNER_'):
			continue
		elif k.startswith('DOTNET_'):
			continue
		elif k.startswith('NVM_'):
			continue
		elif k.startswith('JAVA_'):
			continue
		elif k.startswith('STATS_'):
			continue
		elif k.startswith('PERFLOG_'):
			continue
		elif k.startswith('CHROME_'):
			continue
		elif k.startswith('ANDROID_'):
			continue
		elif k.startswith('POWERSHELL_'):
			continue
		elif k.startswith('SELENIUM_'):
			continue
		elif k.startswith('ACTIONS_'):
			continue
		elif k.startswith('PIPX_'):
			continue
		elif k.startswith('LEIN_'):
			continue
		elif k.startswith('CHROME'):
			continue
		elif k.startswith('GECKO'):
			continue
		elif k.startswith('SYSTEMD_'):
			continue
		elif k.startswith('SWIFT_'):
			continue
		elif k.startswith('VCPKG_'):
			continue
		elif k.startswith('JOURNAL_'):
			continue
		elif k.startswith('HOMEBREW_'):
			continue
		elif k.startswith('AZURE_'):
			continue
		env[k] = v
	print('cleanenv:', ' '.join(cmd), flush = True)
	try:
		run(cmd, env = env, check = True)
	except CalledProcessError as err:
		print(err, file = sys.stderr, flush = True)
		sys.exit(err.returncode)
	sys.exit(0)
