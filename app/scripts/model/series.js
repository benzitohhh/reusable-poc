(function() {
  var eqip   = this.eqip || {};
  eqip.model = eqip.model || {};
  var ns = eqip.model.series = eqip.model.series || {};

  var T_GROUPS = ["APAC", "EUROPE", "USA", "OTHER"];

  function getRgCountsPerYear(pFams) {
    // Returns histogram of patent registrations: (year -> freq)
    return pFams.reduce(function(acc, p) {
      var priYr = p.priorityDate.slice(0, 4); // use priorityDate (i.e. includes all outcomes: "accepted", "pending", "rejected"))
      acc[priYr] = acc[priYr] ? acc[priYr] + 1 : 1;
      return acc;
    }, {});    
  }

  function getCumlRgAcceptedCountsPerYear(pFams) {
    // Returns cumulative histogram of accepted patent registrations: (year -> freq)
    var currDate = new Date(),
        currYear = currDate.getFullYear();

    return pFams.reduce(function(acc, p) {
      // for each patFam p in cluster...
      // extract priority year (should always exist)
      var priYr = p.priorityDate.slice(0, 4);
      if (p.grantDate) {
        // Grant year exists (i.e. application was accepted).
        // We assume that right still exists now.
        // So increment all years from priorityDate to now.
        d3.range(+priYr, currYear + 1).forEach(function(yr) { 
          acc[yr] = acc[yr] ? acc[yr] + 1: 1; 
        });
      }
      return acc;
    }, {});    
  }

  function getYearRange(yearMap) {
    // Given map of years, return continuous range of years.
    var yearsArr = d3.keys(yearMap).sort();
    return d3.range(+yearsArr[0], +yearsArr[yearsArr.length - 1] + 1);
  }

  function getAsStackableSeries(keyToOrdinalToVal, ordinalSet) {
    // Given (key -> (ordinal -> val)) and a set of ordinals,
    // return an array of "ordinal series".
    // i.e. Each series has the same number of elements (one per member of the orderinal set).
    return d3.values(keyToOrdinalToVal).map(function(vals) {
      return ordinalSet.map(function(ordinal) {
        return {x: ordinal, y: vals[ordinal] ? vals[ordinal] : 0 };
      });
    });
  }

  /**
   * Returns (outcome -> (year -> freq)).
   */
  ns.registrationsPerYearPerOutcome = function(pFams) {
    // Construct histograms: outcome -> (year -> freq)
    var countsPerOc  = {"grant":{}, "priority":{}, "priority_accepted":{}, "priority_pending":{}, "priority_expired":{} },
        yearsSet     = {},
        currDate     = new Date(),
        secs_in_year = 1000 * 60 * 60 * 24 * 365,
        inc          = function(o, k) { o[k] = o[k] ? o[k] + 1 : 1; };
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

    var years = getYearRange(yearsSet); // Calculate x domain (range of years)

    // We are only interested in priority dates, so remove the others.
    delete countsPerOc["grant"];
    delete countsPerOc["priority"];

    return getAsStackableSeries(countsPerOc, years); // Transform to series
  };

  /**
   * Return (year -> freq), as a single series.
   */
  ns.registrationsPerYear = function(pFams) {
    var counts = getRgCountsPerYear(pFams);       // histogram
    var years  = getYearRange(counts);            // Calculate x domain (range of years)
    return getAsStackableSeries([counts], years); // Transform to series
  };

  /**
   * Returns (key -> (year -> freq)).
   */
  ns.registrationsPerYearPerKey = function(keyToPfams) {
    var countsPerKey = d3.values(keyToPfams).map(getRgCountsPerYear); // histograms
    var yearMap      = countsPerKey.reduce(function(acc, d) { return $.extend(acc, d); }, {});
    var years        = getYearRange(yearMap); // Calculate x domain (range of years)
    return getAsStackableSeries(countsPerKey, years); // Transform to series
  };

  /**
   * Returns (outcome -> (year -> freq)).
   */
  ns.cumlRightsPerYearPerOutcome = function(pFams) {
    // Construct histograms: outcome -> (year -> freq)
    var countsPerOc  = { "grant":{}, "priority_pending":{} },
        yearsSet     = {},
        currDate     = new Date(),
        currYear     = currDate.getFullYear(),
        secs_in_year = 1000 * 60 * 60 * 24 * 365,
        inc          = function(o, k) { o[k] = o[k] ? o[k] + 1 : 1; };
    pFams.forEach(function(p) {
      // for each patFam p in cluster...
      // extract priority year (should always exist)
      var priYr = p.priorityDate.slice(0, 4);
      if (p.grantDate) {
        // Grant year exists (i.e. application was accepted).
        // We assume that right still exists now.
        // So increment all years from priorityDate to now.
        d3.range(+priYr, currYear + 1).forEach(function(yr) { 
          inc(countsPerOc['grant'], yr);
        });
        yearsSet[priYr] = true;
      } else if (new Date(p.priorityDate).getTime() + 4 * secs_in_year > currDate) {
        // Patent application has not yet expired
        // ie We assume applications automatically expire after 4 years
        // NOTE: it could still have been rejected.
        // TODO: check how TR deal with this.
        d3.range(+priYr, currYear + 1).forEach(function(yr) { 
          inc(countsPerOc['priority_pending'], yr);
        });
        yearsSet[priYr] = true;
      }
    });
    var years = getYearRange(yearsSet); // Calculate x domain (range of years)
    return getAsStackableSeries(countsPerOc, years); // Transform to series
  };

  /**
   * Returns (year -> freq).
   */
  ns.cumlRightsPerYear = function(pFams) {
    var counts = getCumlRgAcceptedCountsPerYear(pFams); // Histogram
    var years  = getYearRange(counts);                  // Calculate x domain (range of years)
    return getAsStackableSeries([counts], years);       // Transform to series
  };

  /**
   * Returns (key -> (year -> freq)).
   */
  ns.cumlRightsPerYearPerKey = function(keyToPfams) {
    var countsPerKey = d3.values(keyToPfams).map(getCumlRgAcceptedCountsPerYear); // histograms
    var yearMap      = countsPerKey.reduce(function(acc, d) { return $.extend(acc, d); }, {});
    var years        = getYearRange(yearMap); // Calculate x domain (range of years)
    return getAsStackableSeries(countsPerKey, years); // Transform to series
  };

  /**
   * Returns (terrGroup -> freq).
   */
  ns.rightsPerTerrGroup = function(terrToTGroup, pFams) {
    // Count by territory group
    var tGroups = pFams.map(function(p) { // for each pFam, get array of tGroups
      return p.territories.map(function(t) { t = t.toLowerCase(); return terrToTGroup[t] ? terrToTGroup[t] : "OTHER"; });
    });
    var count_init = T_GROUPS.reduce(function(acc, d) { acc[d] = 0; return acc; }, {});
    var count = tGroups.reduce(function(acc, pTerrs) { // Limit each group to one count per pFam, using a d3 Set.
      T_GROUPS.forEach(function(t) { if (d3.set(pTerrs).has(t)) acc[t]++; });
      return acc;
    }, count_init);
    return count;
  };

  /**
   * Returns (key ->(terrGroup -> freq)).
   */
  ns.rightsPerTerrGroupPerKey = function(terrToTGroup, keyToPfams) {};

  /**
   * Returns (territory -> freq).
   */
  ns.rightsPerTerritory = function(terrToTGroup, pFams, tGroup) {
    // Count by territories within the given tGroup
    var count = pFams.reduce(function(acc, p) {
      p.territories
        .filter(function(t) { // only count the territories we are interested in...
          t = t.toLowerCase();
          if (tGroup != "OTHER") {
            return terrToTGroup[t] == tGroup;
          } else {
            // tGroup is "OTHER", so we are interested in territories that are missing from the terrToTGroup map.
            return !d3.set(T_GROUPS).has(terrToTGroup[t]);
          }
        })
        .forEach(function(t) { acc[t] = acc[t] ? acc[t] + 1 : 1; });
      return acc;
    }, {});    
    return count;
  };

  /**
   * Returns (key -> (territory -> freq)).
   */
  ns.rightsPerTerritoryPerKey = function(terrToTGroup, keyToPfams, tGroup) {};
})();
