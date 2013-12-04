// ================= TEMP FUNCTIONS FOR FAKE DATA ======
function fakeMissingGrantDates(pFams){
  // Select first and last quarter of the fams.
  var subset = pFams.slice(0, Math.ceil(pFams.length / 4))
                    .concat(pFams.slice(pFams.length - Math.ceil(pFams.length / 4)));

  // Remove grant dates on the subset (to simulate missing grant dates)
  subset.forEach(function(p) { delete p.grantDate; });
}

function randomPriDate(priDateStr) {
  // apply noise to priDate (ensure result within [1965, 2012]
  var priYr = +priDateStr.slice(0, 4);
  var delta_max = 2013 - priYr;
  var delta_min = Math.min(0, 1965 - priYr);
  var delta = Math.floor(delta_min + (delta_max - delta_min) * Math.random());
  var nYear = priYr + delta;
  return nYear + "" + priDateStr.slice(4);    
}

function getFakeData(patFams) {
  return patFams.map(function(p) {
    var np = $.extend(true, {}, p);
    np.priorityDate = randomPriDate(np.priorityDate);
    return np;
  });
}

function getFakePatfamsByCompany(bose_pFams, hiwave_pFams) {
  return {
    "Bose"                 : bose_pFams,
    "Hiwave"               : hiwave_pFams,
    "Global Omnicorp"      : getFakeData(bose_pFams),
    "Patently Obvious PLC" : getFakeData(bose_pFams),
    "Kinda Big Deal inc."  : getFakeData(bose_pFams),
    "Holding Holdings"     : getFakeData(hiwave_pFams),
    "Acme LLC"             : getFakeData(hiwave_pFams)
  };
}


// ================= CLIENT =============================
fakeMissingGrantDates(d3.values(eqip.bosePatFams));
var series               = eqip.model.series,
    util                 = eqip.model.util,
    boseClusterToAccNums = eqip.boseClusters,   // SOURCE DATA
    boseAccNumToPfam     = eqip.bosePatFams,    // SOURCE DATA
    hiwaveAccNumToPfam   = eqip.hiwavePatFams,  // SOURCE DATA
    bosePfamsPerCluster  = util.getPfamsPerCluster(boseClusterToAccNums, boseAccNumToPfam),
    bosePfamsPerNamedCluster = boseClusterToAccNums.reduce(function(acc, d, i) { acc["cluster #" + (i+1)] = bosePfamsPerCluster[i]; return acc; }, {}),
    boseAllPfams         = bosePfamsPerCluster.reduce(function(acc, d) { // WORKAROUND FOR MISMATCH IN CLUSTER/PAT FILES
                             acc = acc.concat(d);
                             return acc;
                             }, []),
    pFamsPerCompany      = getFakePatfamsByCompany(
                             d3.values(boseAccNumToPfam), d3.values(hiwaveAccNumToPfam)); // FAKE DATA

// Get models: ANNUAL REGISTRATIONS
var regs_boseClstr1_byOutcome = series.registrationsPerYearPerOutcome(bosePfamsPerCluster[0] /* cluster 1 */);
var regs_bose                 = series.registrationsPerYear(boseAllPfams); // single series
var regs_bose_byCluster       = series.registrationsPerYearPerKey(bosePfamsPerNamedCluster);
var regs_bose_byCompany       = series.registrationsPerYearPerKey(pFamsPerCompany);

// Get models: CUMULATIVE REGISTRATIONS (only accepted)
var cuml_boseClstr1_byOutcome = series.cumlRightsPerYearPerOutcome(bosePfamsPerCluster[0] /* cluster 1 */);
var cuml_bose                 = series.cumlRightsPerYear(boseAllPfams); // single series
var cuml_bose_byCluster       = series.cumlRightsPerYearPerKey(bosePfamsPerNamedCluster);
var cuml_bose_byCompany       = series.cumlRightsPerYearPerKey(pFamsPerCompany);


// Render charts
var chart = eqip.view.chart;

d3.select("#reg-by-outcome")
  .datum(regs_boseClstr1_byOutcome) // bind data
  .call(chart.registrationsChart()
        .labels(["accepted", "pending", "expired"])
        .colors({1: "#f39c12"})
        .title("BY OUTCOME: Bose (Cluster #1): Registrations per Year")
        .stacked(true)
        .transition(true)
       );

// d3.select("#reg-by-cluster")
//   .datum(regs_bose_byCluster) // bind data
//   .call(chart.registrationsChart()
//         .labels(d3.keys(regs_bose_byCluster).map(function(d) { return "cluster #" + (+d+1); }))
//         .colors(["#000000", "#00FF00", "#FF6600", "#3399FF"])
//         .title("BY CLUSTER: Bose: Registrations per Year")
//         .stacked(true)
//         .transition(true)
//        );

// d3.select("#reg-by-company")
//   .datum(regs_bose_byCompany) // bind data
//   .call(chart.registrationsChart()
//         .labels(d3.keys(pFamsPerCompany))
//         .title("BY COMPANY: Bose & Peers: Registrations per Year")
//         .stacked(true)
//         .colors(["#000000", "#00FF00", "#FF6600", "#3399FF", "#0000FF", "#999"])
//         .transition(true)
//        );

// d3.select("#cuml-by-outcome")
//   .datum(cuml_boseClstr1_byOutcome) // bind data
//   .call(chart.portfolioChart()
//         .labels(["granted", "pending"])
//         //.colors({1: "#f39c12"})
//         .title("BY STATUS: Bose (Cluster #1): Portfolio")
//         .stacked(true)
//         .transition(true)
//        );

// d3.select("#cuml-by-cluster")
//   .datum(cuml_bose_byCluster) // bind data
//   .call(chart.portfolioChart()
//         .labels(d3.keys(regs_bose_byCluster).map(function(d) { return "cluster #" + (+d+1); }))
//         .colors(["#000000", "#00FF00", "#FF6600", "#3399FF"])
//         .title("BY CLUSTER: Bose: Portfolio")
//         .stacked(true)
//         .transition(true)
//        );

d3.select("#cuml-by-company")
  .datum(cuml_bose_byCompany) // bind data
  .call(chart.portfolioChart()
        .labels(d3.keys(pFamsPerCompany))
        .title("BY COMPANY: Bose & Peers: Portfolio")
        .stacked(true)
        .colors(["#000000", "#00FF00", "#FF6600", "#3399FF", "#0000FF", "#999"])
        .transition(true)
       );
