// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.
console.debug('Game assets load.');

{{- $cdn := site.Params.cdn }}
console.debug('Assets CDN: {{ $cdn }}');

{{- $buildID := getenv "HUGO_CLVQ_BUILD" | default "UNSET" }}
console.debug('Assets build ID: {{ $buildID }}');

{{- with site.Params.game_assets }}
	{{- range . }}
console.debug('Fetch: {{ . }}');
fetch('{{ $cdn }}/{{ . }}?v={{ $buildID }}');
	{{- end }}
{{- end }}
