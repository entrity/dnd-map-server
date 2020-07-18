#!/bin/bash

cat <<-EOF | ssh -A dod
	cd /var/www/dnd2
	git pull
	cd react-app
	npm run build && echo OK || >&2 echo FAIL
EOF
