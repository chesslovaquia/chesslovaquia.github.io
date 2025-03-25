// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"sort"
)

var cfg *Config

type Config struct {
	Project string
	Tpl     *TplData
	Pages   map[string]*Page
}

func newConfig() {
	cfg = &Config{
		Project: "clvq",
		Tpl:     newTplData(),
		Pages:   make(map[string]*Page),
	}
}

func configLoad(filename string) error {
	if fh, err := os.Open(filename); err != nil {
		return err
	} else {
		defer fh.Close()
		if blob, err := ioutil.ReadAll(fh); err != nil {
			return err
		} else {
			if err := json.Unmarshal(blob, cfg); err != nil {
				return err
			}
		}
	}
	return nil
}

func (c *Config) PagesList() []string {
	l := make([]string, 0, len(c.Pages))
	for k := range c.Pages {
		l = append(l, k)
	}
	sort.Strings(l)
	return l
}

type Page struct {
	In  string
	Out string
}
