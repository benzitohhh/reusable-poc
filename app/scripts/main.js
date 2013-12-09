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
var series                    = eqip.model.series,
    util                      = eqip.util.util,
    chart                     = eqip.view.chart,
    refData                   = eqip.model.static,
    terrToTGroup              = refData.terrToTGroup,
    boseClusterToAccNums      = eqip.boseClusters,   // SOURCE DATA
    boseAccNumToPfam          = eqip.bosePatFams,    // SOURCE DATA
    hiwaveAccNumToPfam        = eqip.hiwavePatFams,  // SOURCE DATA
    bosePfamsPerCluster       = util.getPfamsPerCluster(boseClusterToAccNums, boseAccNumToPfam),
    bosePfamsPerNamedCluster  = boseClusterToAccNums.reduce(function(acc, d, i) { acc["cluster #" + (i+1)] = bosePfamsPerCluster[i]; return acc; }, {}),
    boseAllPfams              = bosePfamsPerCluster.reduce(function(acc, d) { // WORKAROUND FOR MISMATCH IN CLUSTER/PAT FILES
                                  acc = acc.concat(d);
                                  return acc;
                               }, []),
    pFamsPerCompany           = getFakePatfamsByCompany(
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

// Get models: TERRITORIES (single series)
var tGroups_boseClstr1         = series.rightsPerTerrGroupPerKey(terrToTGroup, [bosePfamsPerCluster[0]]); // limits each tGroup to one count per pFam.
var terrs_boseClstr1_EU        = series.rightsPerTerritoryPerKey(terrToTGroup, [bosePfamsPerCluster[0]], "EUROPE"); // single pFam can be in multiple territories
var terrs_boseClstr1_USA       = series.rightsPerTerritoryPerKey(terrToTGroup, [bosePfamsPerCluster[0]], "USA");
var terrs_boseClstr1_APAC      = series.rightsPerTerritoryPerKey(terrToTGroup, [bosePfamsPerCluster[0]], "APAC");
var terrs_boseClstr1_OTHER     = series.rightsPerTerritoryPerKey(terrToTGroup, [bosePfamsPerCluster[0]], "OTHER");
var terrs_boseClstr1_ALL       = series.rightsPerTerritoryPerKey(terrToTGroup, [bosePfamsPerCluster[0]]); // no arg means "all" tGroups
// Get models: TERRITORIES (multi series)
var tGroups_bose_byCluster     = series.rightsPerTerrGroupPerKey(terrToTGroup, bosePfamsPerNamedCluster);
var terrs_bose_EU_byCluster    = series.rightsPerTerritoryPerKey(terrToTGroup, bosePfamsPerNamedCluster, "EUROPE");
var terrs_bose_USA_byCluster   = series.rightsPerTerritoryPerKey(terrToTGroup, bosePfamsPerNamedCluster, "USA");
var terrs_bose_APAC_byCluster  = series.rightsPerTerritoryPerKey(terrToTGroup, bosePfamsPerNamedCluster, "APAC");
var terrs_bose_OTHER_byCluster = series.rightsPerTerritoryPerKey(terrToTGroup, bosePfamsPerNamedCluster, "OTHER");
var terrs_bose_ALL_byCluster   = series.rightsPerTerritoryPerKey(terrToTGroup, bosePfamsPerNamedCluster); // no arg means "all" tGroups
var tGroups_bose_byCompany     = series.rightsPerTerrGroupPerKey(terrToTGroup, pFamsPerCompany);
var terrs_bose_EU_byCompany    = series.rightsPerTerritoryPerKey(terrToTGroup, pFamsPerCompany, "EUROPE");
var terrs_bose_USA_byCompany   = series.rightsPerTerritoryPerKey(terrToTGroup, pFamsPerCompany, "USA");
var terrs_bose_APAC_byCompany  = series.rightsPerTerritoryPerKey(terrToTGroup, pFamsPerCompany, "APAC");
var terrs_bose_OTHER_byCompany = series.rightsPerTerritoryPerKey(terrToTGroup, pFamsPerCompany, "OTHER");
var terrs_bose_ALL_byCompany   = series.rightsPerTerritoryPerKey(terrToTGroup, pFamsPerCompany, "ALL"); // no arg means "all" tGroups


//=========== DEMOS ===========
function demo1() {
  // 1. COLUMN CHART: STACKED
  // 2. Show with fake data.
  // 3. COLUMN CHART: STACKED -> GROUPED
  // 4. Switch off fake data.
  d3.select("#reg-by-outcome")
    .datum(regs_boseClstr1_byOutcome) // bind data
    .call(chart.registrationsChart()
          .labels(["accepted", "pending", "expired"])
          .colors({1: "#f39c12"})
          .title("BY OUTCOME: Bose (Cluster #1): Registrations per Year")
          .transition(true)
          //.group() // uncomment for grouped (rather than stacked)
         );  
}

function demo2() {
  // COLUMN -> AREA (and streams) -> LINE
  d3.select("#reg-by-company")
    .datum(regs_bose_byCompany) // bind data
    .call(chart.registrationsChart()
          .labels(d3.keys(pFamsPerCompany))
          .title("BY COMPANY: Bose & Peers: Registrations per Year")
          .colors(["#000000", "#00FF00", "#FF6600", "#3399FF", "#0000FF", "#999"])
          .transition(true)
          // By default, this is a stacked column chart...
          //.area() // uncomment for area chart
          //  .stream()     // stream: combine with area()
          //  .streamRel()  // stream relative: combine with area()
          //.line() // uncomment for line graph
         );
}

function demo3() {
  // territory charts (bar charts)
  // TODO: add to demoAll()
  d3.select("#tGroups-boseClstr1")
    .datum(tGroups_boseClstr1) // bind data
    .call(chart.territoriesChart()
          // Single series, so no labels or colors needed
          .title("Bose Cluster #1: Rights per Territory-Group")
          .transition(true)
         );
}

//demo3();
demo4();
//demoAll();
//demo1();
function demo4() {
  // more territory charts (bar charts)
  // TODO: add to demoAll()
  d3.select("#tGroups-bose-byCluster")
    .datum(tGroups_bose_byCluster) // bind data
    .call(chart.territoriesChart()
          // Single series, so no labels or colors needed
          .title("Bose Cluster #1: Rights per Territory-Group")
          .transition(true)
          .labels(d3.keys(bosePfamsPerNamedCluster))
          .colors(["blue", "red", "green", "purple"])
         );


}


function demoAll() {
  d3.select("#reg-by-outcome")
    .datum(regs_boseClstr1_byOutcome) // bind data
    .call(chart.registrationsChart()
          .labels(["accepted", "pending", "expired"])
          .colors({1: "#f39c12"})
          .title("BY OUTCOME: Bose (Cluster #1): Registrations per Year")
          .transition(true)
         );

  d3.select("#reg-by-cluster")
    .datum(regs_bose_byCluster) // bind data
    .call(chart.registrationsChart()
          .labels(d3.keys(regs_bose_byCluster).map(function(d) { return "cluster #" + (+d+1); }))
          .colors(["#000000", "#00FF00", "#FF6600", "#3399FF"])
          .title("BY CLUSTER: Bose: Registrations per Year")
          .transition(true)
         );

  d3.select("#reg-by-company")
    .datum(regs_bose_byCompany) // bind data
    .call(chart.registrationsChart()
          .labels(d3.keys(pFamsPerCompany))
          .title("BY COMPANY: Bose & Peers: Registrations per Year")
          .colors(["#000000", "#00FF00", "#FF6600", "#3399FF", "#0000FF", "#999"])
          .transition(true)
         );

  d3.select("#cuml-by-outcome")
    .datum(cuml_boseClstr1_byOutcome) // bind data
    .call(chart.portfolioChart()
          .labels(["granted", "pending"])
          .title("BY STATUS: Bose (Cluster #1): Portfolio")
          .transition(true)
         );

  d3.select("#cuml-by-cluster")
    .datum(cuml_bose_byCluster) // bind data
    .call(chart.portfolioChart()
          .labels(d3.keys(regs_bose_byCluster).map(function(d) { return "cluster #" + (+d+1); }))
          .colors(["#000000", "#00FF00", "#FF6600", "#3399FF"])
          .title("BY CLUSTER: Bose: Portfolio")
          .transition(true)
         );

  d3.select("#cuml-by-company")
    .datum(cuml_bose_byCompany) // bind data
    .call(chart.portfolioChart()
          .labels(d3.keys(pFamsPerCompany))
          .title("BY COMPANY: Bose & Peers: Portfolio")
          .stacked(true)
          .colors(["#000000", "#00FF00", "#FF6600", "#3399FF", "#0000FF", "#999"])
          .transition(true)
         );
  
}
