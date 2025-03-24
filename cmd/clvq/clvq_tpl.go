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

type TplData struct {
	Root string
}

func newTplData() *TplData {
	return &TplData{
		Root: "",
	}
}

func (d *TplData) Dup() *TplData {
	return &TplData{
		Root: d.Root,
	}
}

type Tpl struct {
	Path string
	Dir  string
	Base string
}

func newTpl(path string) *Tpl {
	return &Tpl{
		Path: path,
		Dir:  optTplDir,
		Base: optTplBase,
	}
}

func (t *Tpl) BaseFile() string {
	return filepath.Join(t.Dir, t.Base)
}

func (t *Tpl) Load() (*template.Template, error) {
	return template.ParseFiles(t.BaseFile(), t.Path)
}

func (t *Tpl) Get() (*template.Template, error) {
	tplMutex.Lock()
	defer tplMutex.Unlock()

	// Always reload template
	newTmpl, err := t.Load()
	if err != nil {
		return nil, err
	}
	return newTmpl, nil
}

func (t *Tpl) GetData() *TplData {
	data := cfg.Tpl.Dup()
	path := t.Path[:len(t.Path)-5] + ".json"
	blob, err := ioutil.ReadFile(path)
	if err != nil {
		x := fmt.Errorf("%s failed to read file: %w", path, err)
		log.Print(x)
		return data
	}
	if err := json.Unmarshal(blob, data); err != nil {
		x := fmt.Errorf("%s failed to parse file: %w", path, err)
		log.Print(x)
		return data
	}
	return data
}

func (t *Tpl) Render(output string) error {
	tmpl, err := t.Load()
	if err != nil {
		return err
	}
	data := t.GetData()
	outputFile, err := os.Create(output)
	if err != nil {
		return err
	}
	defer outputFile.Close()
	return tmpl.Execute(outputFile, data)
}

func tplMain(input, output string) {
	log.SetFlags(0)
	if err := configLoad(optConfigFile); err != nil {
		log.Fatalf("[ERROR] %v", err)
	}
	t := newTpl(input)
	log.Printf("render: %s %s -> %s", t.BaseFile(), t.Path, output)
	if err := t.Render(output); err != nil {
		log.Fatalf("[ERROR] render %s: %v", t.Path, err)
	}
}
