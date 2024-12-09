node_modules/: package-lock.json
	npm i -D
	touch node_modules/


test: node_modules/
	npm run test
