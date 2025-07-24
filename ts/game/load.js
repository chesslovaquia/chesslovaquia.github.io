// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

console.debug('Game assets load.');

{{- $cdn := site.Params.cdn }}
{{- with site.Params.game_assets }}
	{{- range . }}
console.debug("Fetch: {{ $cdn }}/{{ . }}");
fetch("{{ $cdn }}/{{ . }}");
	{{- end }}
{{- end }}
