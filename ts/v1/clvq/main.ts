// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Clvq } from './Clvq'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  (window as any).Clvq = new Clvq()
})
