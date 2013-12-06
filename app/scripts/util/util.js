(function() {

  // Given array of clusters, returns an array of (array of patFams).
  function getPfamsPerCluster(clusters, accNumToPFam) {
    return clusters.map(function(cluster) {
      return cluster.members.map(function(accNum) {
        var p = accNumToPFam[accNum];
        if (!p) { console.error("MISSING patFam: accNum=" + accNum); }
        return p;
      }).filter(function(p) { return p != null; });
    });
  };

  // Given array of arrays, returns single "flat" array
  function flatten(arr){
    return arr.reduce(function(acc, d) { return acc.concat(d); }, []);
  }

  // export
  var eqip                = this.eqip || {};
  eqip.util               = eqip.util || {};
  var util                = eqip.util.util = eqip.util.util || {};
  util.getPfamsPerCluster = getPfamsPerCluster;
  util.flatten            = flatten;

})();
