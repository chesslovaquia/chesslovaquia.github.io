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
	"sync"
)

var (
	tmplMutex sync.Mutex
)

func getTemplateData(tpl string) map[string]string {
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

func loadTemplate(path string) (*template.Template, error) {
	return template.ParseFiles("tpl/base.html", path)
}

func getTemplate(path string) (*template.Template, error) {
	tmplMutex.Lock()
	defer tmplMutex.Unlock()

	// Always reload template
	newTmpl, err := loadTemplate(path)
	if err != nil {
		return nil, err
	}
	return newTmpl, nil
}

func renderFile(input, output string) error {
	tmpl, err := loadTemplate(input)
	if err != nil {
		return err
	}

	data := getTemplateData(input)

	outputFile, err := os.Create(output)
	if err != nil {
		return err
	}
	defer outputFile.Close()

	return tmpl.Execute(outputFile, data)
}
