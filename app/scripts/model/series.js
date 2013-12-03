(function() {
  var eqip   = this.eqip || {};
  eqip.model = eqip.model || {};
  var series = eqip.model.series = eqip.model.series || {};

  function getRgCountsPerYear(pFams) {
    // Construct histogram: (year -> freq)
    return pFams.reduce(function(acc, p) {
      var priYr = p.priorityDate.slice(0, 4); // use priorityDate
      acc[priYr] = acc[priYr] ? acc[priYr] + 1 : 1;
      return acc;
    }, {});    
  }

  function getYearRange(yearMap) {
    // Given map of years, return continuous range of years.
    var yearsArr = d3.keys(yearMap).sort();
    return d3.range(+yearsArr[0], +yearsArr[yearsArr.length - 1] + 1);
  }

  function getAsSeries(keyToOrdinalToVal, ordinalSet) {
    // Given (key -> (ordinal -> val)) and a set of ordinals,
    // return an array of "ordinal series".
    // i.e. Each series contains an element for each members of the ordinal set.
    return d3.values(keyToOrdinalToVal).map(function(vals) {
      return ordinalSet.map(function(ordinal) {
        return {x: ordinal, y: vals[ordinal] ? vals[ordinal] : 0 };
      });
    });
  }

  /**
   * Returns (outcome -> (year -> freq)).
   */
  series.registrationsPerYearPerOutcome = function(pFams) {

    // Construct histograms: outcome -> (year -> freq)
    var countsPerOc = {"grant":{}, "priority":{}, "priority_accepted":{}, "priority_pending":{}, "priority_expired":{} },
        yearsSet = {},
        currDate = new Date(),
        secs_in_year = 1000 * 60 * 60 * 24 * 365,
        inc = function(o, k) { o[k] = o[k] ? o[k] + 1 : 1; };
    pFams.forEach(function(p) {
      // for each patFam p in cluster...
      // extract priority year (should always exist)
      var priYr = p.priorityDate.slice(0, 4);
      yearsSet[priYr] = true;
      inc(countsPerOc['priority'], priYr);
      if (p.grantDate) {
        // Grant year exists (i.e. application was accepted)
        var graYr = p.grantDate.slice(0, 4);
        yearsSet[graYr] = true;
        inc(countsPerOc['grant'], graYr);
        inc(countsPerOc['priority_accepted'], priYr);
      } else if (new Date(p.priorityDate).getTime() + 4 * secs_in_year < currDate) {
        // Patent application has expired
        // ie We assume applications automatically expire after 4 years
        inc(countsPerOc['priority_expired'], priYr);
      } else {
        // Application may still be pending.
        // It could also be rejected, we don't know from the data.
        inc(countsPerOc['priority_pending'], priYr);
      }
    });

    // Calculate x domain (range of years)
    var years = getYearRange(yearsSet);

    // For now, we are only interested in priority dates, so remove the others.
    delete countsPerOc["grant"];
    delete countsPerOc["priority"];

    // Transform histograms to series
    var labels = {
      "priority_accepted": "accepted", 
      "priority_pending":  "pending",
      "priority_expired":  "expired"
    };
    var series = getAsSeries(countsPerOc, years);

    return { series: series, labels: d3.keys(countsPerOc).map(function(d) { return labels[d]; }) };
  };

  /**
   * Return (year -> freq), as a single series.
   */
  series.registrationsPerYear = function(pFams) {
    var counts = getRgCountsPerYear(pFams);

    // Calculate x domain (range of years)
    var years = getYearRange(counts);

    // Transform histograms to series
    return years.map(function(year) { return { x: year, y: counts[year] ? counts[year] : 0 }; });
  };

  /**
   * Returns (key -> (year -> freq)).
   */
  series.registrationsPerYearPerKey = function(keyToPfams) {
    var countsPerKey = d3.values(keyToPfams).map(getRgCountsPerYear);

    // Calculate x domain (range of years)
    var yearMap = countsPerKey.reduce(function(acc, d) { return $.extend(acc, d); }, {});
    var years = getYearRange(yearMap);

    // Transform histograms to series
    var series = getAsSeries(countsPerKey, years);

    return { series: series, labels: d3.keys(keyToPfams) };
  };

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
