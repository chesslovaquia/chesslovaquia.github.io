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
	GoVersion string
	Root      string
}

func newTplData() *TplData {
	return &TplData{
		GoVersion: envGoVersion,
		Root:      "",
	}
}

func (d *TplData) Dup() *TplData {
	return &TplData{
		GoVersion: d.GoVersion,
		Root:      d.Root,
	}
}

func (d *TplData) Project() string {
	return cfg.Project
}

func (d *TplData) Pages() map[string]*Page {
	return cfg.Pages
}

type Tpl struct {
	path string
	inc  string
	Dir  string
	Base string
}

func newAdminTpl(path string) *Tpl {
	return &Tpl{
		path: path,
		inc:  "inc",
		Dir:  "/opt/clvq/src/base/admin",
		Base: "base.html",
	}
}

func newTpl(path string) *Tpl {
	return &Tpl{
		path: path,
		inc:  optTplInc,
		Dir:  optTplDir,
		Base: optTplBase,
	}
}

func (t *Tpl) Path() string {
	return filepath.Join(t.Dir, t.path)
}

func (t *Tpl) BaseFile() string {
	return filepath.Join(t.Dir, t.Base)
}

func (t *Tpl) Inc(path string) string {
	return filepath.Join(t.Dir, t.inc, path)
}

func (t *Tpl) Load() (*template.Template, error) {
	tpl, err := template.ParseFiles(t.BaseFile(), t.Path())
	if err != nil {
		return nil, err
	}
	// TODO: Tpl.Load check inc dir exists and not empty
	tpl, err = tpl.ParseGlob(t.Inc("*.html"))
	if err != nil {
		return nil, err
	}
	return tpl, nil
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
	p := t.Path()
	path := p[:len(p)-5] + ".json"
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
	log.Printf("render: %s %s -> %s", t.BaseFile(), t.Path(), output)
	if err := t.Render(output); err != nil {
		log.Fatalf("[ERROR] render %s: %v", t.Path(), err)
	}
}
