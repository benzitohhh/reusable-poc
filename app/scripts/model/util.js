var eqip   = eqip || {};
eqip.model = eqip.model || {};
var util = eqip.model.util = eqip.model.util || {};

// Given array of clusters, returns an array of (array of patFams).
util.getPfamsPerCluster = function(clusters, accNumToPFam) {
  return clusters.map(function(cluster) {
    return cluster.members.map(function(accNum) {
      var p = accNumToPFam[accNum];
      if (!p) { console.error("MISSING patFam: accNum=" + accNum); }
      return p;
    }).filter(function(p) { return p != null; });
  });
};
