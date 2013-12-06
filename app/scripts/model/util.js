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

  // export
  var eqip   = this.eqip || {};
  eqip.model = eqip.model || {};
  var util = eqip.model.util = eqip.model.util || {};
  util.getPfamsPerCluster = getPfamsPerCluster;

})();
