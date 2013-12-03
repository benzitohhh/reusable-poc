(function() {
  var eqip   = this.eqip || {};
  eqip.model = eqip.model || {};
  var series = eqip.model.series = eqip.model.series || {};

  // Returns (outcome -> (year -> freq)).
  series.registrationsPerYearPerOutcome = function(pFams) {

    // Construct histograms: outcome -> (year -> freq)
    var counts = {"grant":{}, "priority":{}, "priority_accepted":{}, "priority_pending":{}, "priority_expired":{} },
        yearsSet = {},
        currDate = new Date(),
        secs_in_year = 1000 * 60 * 60 * 24 * 365,
        inc = function(o, k) { o[k] = o[k] ? o[k] + 1 : 1; };
    pFams.forEach(function(p) {
      // for each patFam p in cluster...
      // extract priority year (should always exist)
      var priYr = p.priorityDate.slice(0, 4);
      yearsSet[priYr] = true;
      inc(counts['priority'], priYr);
      if (p.grantDate) {
        // Grant year exists (i.e. application was accepted)
        var graYr = p.grantDate.slice(0, 4);
        yearsSet[graYr] = true;
        inc(counts['grant'], graYr);
        inc(counts['priority_accepted'], priYr);
      } else if (new Date(p.priorityDate).getTime() + 4 * secs_in_year < currDate) {
        // Patent application has expired
        // ie We assume applications automatically expire after 4 years
        inc(counts['priority_expired'], priYr);
      } else {
        // Application may still be pending.
        // It could also be rejected, we don't know from the data.
        inc(counts['priority_pending'], priYr);
      }
    });

    // Calculate x domain (range of years)
    var yearsArr = d3.keys(yearsSet).sort(),
        years    = d3.range(+yearsArr[0], +yearsArr[yearsArr.length - 1] + 1);

    // Transform histograms to series
    var labels = {
      "priority_accepted": "accepted", 
      "priority_pending":  "pending",
      "priority_expired":  "expired"
    };
    var series = d3.keys(labels).map(function(s) {
      return years.map(function(year) { return {x: year, y: counts[s][year] ? counts[s][year] : 0 }; });
    });
    
    return { series: series, labels: d3.values(labels) };
  };

  // Return (year -> freq).
  series.registrationsPerYear = function(pFams) {};

  // Returns (key -> (year -> freq)).
  series.registrationsPerYearPerKey = function(keyToPfams) {};

  // Returns (outcome -> (year -> freq)).
  series.cumlRightsPerYearPerOutcome = function() {};

  // Return (year -> freq).
  series.cumlRightsPerYear = function() {};

  // Returns (key -> (year -> freq)).
  series.cumlRightsPerYearPerKey = function() {};

  // Returns (terrGroup -> freq).
  series.rightsPerTerrGroup = function() {};

  // Returns (key ->(terrGroup -> freq)).
  series.rightsPerTerrGroupPerKey = function() {};

  // Returns (territory -> freq).
  series.rightsPerTerritory = function() {};

  // Returns (key -> (territory -> freq)).
  series.rightsPerTerritoryPerKey = function() {};
})();
