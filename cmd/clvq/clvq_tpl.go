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
	"strings"
	"sync"
)

var (
	tplMutex sync.Mutex
)

// TplData

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

// Tpl

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

func (t *Tpl) incNotEmpty(path string) bool {
	info, err := os.Stat(path)
	if err == nil {
		if info.IsDir() {
			if dir, err := os.Open(path); err != nil {
				log.Printf("templates include: %v", err)
				return false
			} else {
				defer dir.Close()
				// read the first entry
				_, err = dir.Readdir(1)
				if err != nil {
					log.Printf("templates include: %v", err)
					return false
				} else {
					return true
				}
			}
		}
	} else {
		log.Printf("templates include: %v", err)
	}
	return false
}

func (t *Tpl) Load() (*template.Template, error) {
	tpl, err := template.ParseFiles(t.BaseFile(), t.Path())
	if err != nil {
		return nil, err
	}
	if t.incNotEmpty(t.Inc(".")) {
		tpl, err = tpl.ParseGlob(t.Inc("*.html"))
		if err != nil {
			return nil, err
		}
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

// Main

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

func tplMake() {
	log.SetFlags(0)
	if err := configLoad(optConfigFile); err != nil {
		log.Fatalf("[ERROR] %v", err)
	}
	fn := filepath.Join(optTplDir, optTplBuild)
	if err := tplWriteBuildScript(); err != nil {
		log.Fatalf("[ERROR] make %s: %v", fn, err)
	}
	log.Printf("%s done!", fn)
}

// Utils

func tplBuildScript() string {
	sh := make([]string, 0)
	for _, uri := range cfg.PagesList() {
		page := cfg.Pages[uri]
		sh = append(sh, fmt.Sprintf("# %s", uri))
		sh = append(sh, fmt.Sprintf("clvq -i %s -o %s", page.In, page.Out))
	}
	return strings.Join(sh, "\n")
}

func tplWriteBuildScript() error {
	fn := filepath.Join(optTplDir, optTplBuild)
	fh, err := os.Create(fn)
	if err != nil {
		return err
	}
	defer fh.Close()
	_, err = fh.WriteString("#!/bin/sh\n")
	if err != nil {
		return err
	}
	_, err = fh.WriteString("# AUTO GENERATED FILE - DO NOT EDIT!!\n")
	if err != nil {
		return err
	}
	_, err = fh.WriteString("set -e\n")
	if err != nil {
		return err
	}
	_, err = fh.WriteString(tplBuildScript())
	if err != nil {
		return err
	}
	_, err = fh.WriteString("\nexit 0\n")
	if err != nil {
		return err
	}
	return nil
}
