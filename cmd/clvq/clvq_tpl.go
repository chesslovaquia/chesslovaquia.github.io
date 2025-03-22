// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sync"
)

var (
	tplMutex sync.Mutex
)

func tplGetData(tpl string) map[string]string {
	var data map[string]string
	path := tpl[:len(tpl)-5]+".json"
	blob, err := ioutil.ReadFile(path)
	if err != nil {
		x := fmt.Errorf("%s failed to read file: %w", path, err)
		log.Print(x)
		return data
	}
	if err := json.Unmarshal(blob, &data); err != nil {
		x := fmt.Errorf("%s failed to parse file: %w", path, err)
		log.Print(x)
		return data
	}
	return data
}

func tplBaseFile() string {
	return filepath.Join(optTplDir, optTplBase)
}

func tplLoad(path string) (*template.Template, error) {
	return template.ParseFiles(tplBaseFile(), path)
}

func tplGet(path string) (*template.Template, error) {
	tplMutex.Lock()
	defer tplMutex.Unlock()

	// Always reload template
	newTmpl, err := tplLoad(path)
	if err != nil {
		return nil, err
	}
	return newTmpl, nil
}

func tplRender(input, output string) error {
	tmpl, err := tplLoad(input)
	if err != nil {
		return err
	}

	data := tplGetData(input)

	outputFile, err := os.Create(output)
	if err != nil {
		return err
	}
	defer outputFile.Close()

	return tmpl.Execute(outputFile, data)
}

func tplMain(input, output string) {
	log.Printf("render: %s -> %s", input, output)
	if err := tplRender(input, output); err != nil {
		log.Fatalf("[ERROR] render %s -> %s: %v", input, output, err)
	}
}
