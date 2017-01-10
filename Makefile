.PHONY: all build check clean watch distclean which doc

PATH:=./node_modules/.bin:$(PATH)
export PATH

SRC=src/*.ts
TSC=./node_modules/.bin/tsc
TDOC=./node_modules/.bin/typedoc
TSCOPT=-d -t ES5 --noImplicitAny --strictNullChecks --alwaysStrict
DOCOPT=

all: build doc

build: build/ionsible.js
build/ionsible.js: $(SRC)
	$(TSC) $(TSCOPT) --rootDir src --outDir build $^

watch: $(SRC)
	$(TSC) $(TSCOPT) -w --rootDir src --outDir build $^ || true

clean:
	rm -fr build doc

distclean: clean
	rm -fr node_modules

# Using typedoc for documentation, but there's no good, official source
# for where to get a "built" version of typedoc that supports tsc
# 1.8.10, so it's not included in the dev dependencies.
#
# You can set it up from https://github.com/TypeStrong/typedoc
# by following the instructions in UPDATING.md.
doc: doc/index.html
doc/index.html: $(SRC)
	-$(TDOC) $(DOCOPT) -t ES5 --module commonjs src --out doc

which:
	@which $(TSC)
