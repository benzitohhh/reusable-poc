(function() {

  function strengthPerDate() {};
  function strengthPerDatePerKey() {};
  
  // export
  var eqip   = this.eqip || {};
  eqip.model = eqip.model || {};
  var scatter = eqip.model.scatter = eqip.model.scatter || {};
  scatter.strengthPerDate = strengthPerDate;
  scatter.strengthPerDatePerKey = strengthPerDatePerKey;

})();
