// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

var cfg *Config

func init() {
	newConfig()
}

type Config struct {
	Project string
	Tpl     *Tpl
}

func newConfig() {
	cfg = &Config{
		Project: "clvq",
		Tpl:     newTpl(),
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
