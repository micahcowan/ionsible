.PHONY: all build check clean watch distclean which

PATH := ./node_modules/.bin:$(PATH)

SRC=src/*.ts
TSC = tsc
TSCOPT = 

all: build

build: build/ionsible.js
build/ionsible.js: $(SRC)
	$(TSC) $(TSCOPT) -d -t ES5 --rootDir src --outDir build $^

watch: $(SRC)
	$(TSC) $(TSCOPT) -w -d -t ES5 --rootDir src --outDir build $^ || true

clean:
	rm -fr build

distclean: clean
	rm -fr node_modules

which:
	@which $(TSC)
