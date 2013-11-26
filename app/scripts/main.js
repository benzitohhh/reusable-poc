
// per outcome (bose, cluster 1 - fake some missing data)

// per cluster (bose)

// per company (bose, hiwave, and fake two other companies)


// outcome
var outcomes = get_outcome_series();



function get_outcome_series(){
  var cluster = eqip.boseClusters[0].members;

  // ***** TEMPORARY CODE TO SIMULATE VARIATION IN DATA. TODO: remove! *****
  // remove grant date for the first and last quarters
  cluster.slice(0, Math.ceil(cluster.length / 4))
    .concat(cluster.slice(cluster.length - Math.ceil(cluster.length / 4)))
    .forEach(function(pId) {
      delete eqip.bosePatFams[pId].grantDate;
    });
  // ***** END OF TEMPORARY CODE *****

  // Construct histograms
  var hgrams = {"grant":{}, "priority":{}, "priority_accepted":{}, "priority_pending":{}, "priority_expired":{} },
      yearsSet = {},
      currDate = new Date(),
      secs_in_year = 1000 * 60 * 60 * 24 * 365,
      inc = function(o, k) { o[k] = o[k] ? o[k] + 1 : 1; };
  cluster.map(function(pId) {
           var p = eqip.bosePatFams[pId];
           if (!p) { console.log("MISSING patFam: id=" + pId); }
           return p;
         })
         .filter(function(p) { return p != null; })
         .forEach(function(p) {
           // for each patFam p in cluster...
           // extract priority year (should always exist)
           var priYr = p.priorityDate.slice(0, 4);
           yearsSet[priYr] = true;
           inc(hgrams['priority'], priYr);
           if (p.grantDate) {
             // Grant year exists (i.e. application was accepted)
             var graYr = p.grantDate.slice(0, 4);
             yearsSet[graYr] = true;
             inc(hgrams['grant'], graYr);
             inc(hgrams['priority_accepted'], priYr);
           } else if (new Date(p.priorityDate).getTime() + 4 * secs_in_year < currDate) {
             // Patent application has expired
             // ie We assume applications automatically expire after 4 years
             inc(hgrams['priority_expired'], priYr);
           } else {
             // Application may still be pending.
             // It could also be rejected, we don't know from the data.
             inc(hgrams['priority_pending'], priYr);
           }
         });

  // Calculate x domain (discrete range of years)
  var yearsArr = d3.keys(yearsSet).sort();
  var years = d3.range(+yearsArr[0], +yearsArr[yearsArr.length - 1] + 1);

  // TODO: remove unwanted series
  // TODO: label them!

  // Transform histograms to series
  var series = d3.keys(hgrams).map(function(s) {
    return years.map(function(year) {
      return {x: year, y: hgrams[s][year] ? hgrams[s][year] : 0 };
    });
  });

  return series;
  
}


