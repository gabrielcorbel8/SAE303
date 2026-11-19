/**
 * js/script.js : wrapper de compatibilité pointant vers les composants modulaires du dossier scripts/
 * SAE 3.01 - 3.03 M2Droit
 */

// Si les scripts modulaires n'ont pas encore été chargés, on les charge séquentiellement
(function () {
  if (!window.MAINAPP || !window.MAINAPP.network) {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js',
      'scripts/storage.js',
      'scripts/network.js',
      'scripts/visDataPreprocessor.js',
      'scripts/visualisations.js',
      'scripts/main.js'
    ];

    function loadNext(index) {
      if (index >= scripts.length) return;
      const s = document.createElement('script');
      s.src = scripts[index];
      s.onload = () => loadNext(index + 1);
      s.onerror = () => loadNext(index + 1);
      document.body.appendChild(s);
    }

    loadNext(0);
  }
}());
