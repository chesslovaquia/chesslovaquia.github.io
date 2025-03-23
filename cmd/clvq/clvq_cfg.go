// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

var cfg *Config

func init() {
	newConfig()
}

type Config struct {
	Project string
	Tpl *Tpl
}

func newConfig() {
	cfg = &Config{
		Project: "clvq",
		Tpl: newTpl(),
	}
}

func configLoad(filename string) error {
	return nil
}
