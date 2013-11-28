// ================= CLIENT =============================
fakeMissingGrantDates();
var series_outcomes = getSeries_outcomes();
var series_cluster = getSeries_cluster();
var series_company = getSeries_company();

// var chart = reg();
              // .x(function(d) { return d.x; }) // TODO: set x-accessor as required
              // .y(function(d) { return d.y; });// TODO: set y-accessor as required

d3.select("#outcome-chart")
  .datum(series_outcomes.map(function(d) { return d.series; }))  // bind data to selection
  .call(reg()); // calls our chart, passing in selection

// d3.select("#cluster-chart")
//   .datum(series_cluster.map(function(d) { return d.series; }))  // bind data to selection
//   .call(reg()); // calls our chart, passing in selection

// d3.select("#company-chart")
//   .datum(series_company.map(function(d) { return d.series; }))  // bind data to selection
//   .call(reg()); // calls our chart, passing in selection

// ================== CHART ==============================
function reg() {
  // see http://bost.ocks.org/mike/chart/
  // BASICALLY: implement reusable components as closures with getter-setter methods

  var margin = {top: 40, right: 150, bottom: 30, left: 40},
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom,
      // xValue = function(d) { return d[0]; }, // BEN: default x-accessor
      // yValue = function(d) { return d[1]; }, // BEN: default y-accessor
      xValue = function(d) { return d.x; }, // BEN: default x-accessor
      yValue = function(d) { return d.y; }, // BEN: default y-accessor
      xScale = d3.scale.ordinal().rangeRoundBands([0, width], 0.5),
      yScale = d3.scale.linear().rangeRound([height, 0]),
      xAxis  = d3.svg.axis().scale(xScale)
                            .ticks(10)
                            .tickSubdivide(0) // don't show decimals
                            .outerTickSize(0) // don't show outer ticks
                            .orient("bottom"),
      yAxis  = d3.svg.axis()
                     .scale(yScale)
                     .orient("left")
                     .tickFormat(d3.format("d"))
                     .tickSize(-width) // extend ticks out, so they become grid lines
                     .tickPadding(6)   // leave some space near labels
                     .tickSubdivide(0); // don't show decimals

  function chart(selection) {
    selection.each(function(data) { // BEN: iterate over selection (d3 passes in data)

      // Convert data to standard representation greedily;
      // this is needed for nondeterministic accessors.
      data = data.map(function(s) {
        return s.map(function(d, i) {
          return [xValue.call(s, d, i), yValue.call(s, d, i)]; 
        });
      });

      var data_flat = data.reduce(function(acc, d) { return acc.concat(d); }, []);

      // Update the x-scale.
      var xExt    = d3.extent(data_flat, function(d) { return d[0]; }); // BEN: d3.extent gets max/min in array
      var xDomain = d3.range(xExt[0], xExt[1] + 1);
      xScale
          .domain(xDomain)
          .rangeRoundBands([0, width], 0.5);
      if (xDomain.length > 10) {
        // Restrict number of x-axis ticks, to ensure that year labels do not overlap.
        // In general, we only have space for approximately 10 labels
        var divisor  = Math.ceil(xDomain.length / 10);
        var startIdx = xDomain[0] % 5 ? (5 - xDomain[0] % 5) : 0; // first index whose val is a multiple of 5
        var subset   = xDomain.filter(function(d, i) { return (i - startIdx) % divisor == 0; });
        xAxis.tickValues(subset);
        // Use less padding (otherwise bars will be too narrow)
        xScale.rangeRoundBands([0, width], 0.1);
      }

      // Update the y-scale.
      yScale
          .domain([0, d3.max(data_flat, function(d) { return d[1]; })])
          .rangeRound([height, 0]);
      var yTicks = yScale.ticks().filter(function(d, i) { return d % 1 === 0; }); // remove non-integers
      yAxis.tickValues(yTicks);

      // Temporary color scale.
      var color = d3.scale.linear()
        .domain([0, data.length - 1])
        .range(["#f00", "#00f"]);

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]); // BEN: see http://stackoverflow.com/questions/14665786/some-clarification-on-reusable-charts

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg").append("g");
      gEnter.append("g").attr("class", "x axis");
      gEnter.append("g").attr("class", "y axis");

      // Update the outer dimensions.
      svg .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom);

      // Update the inner dimensions.
      var g = svg.select("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Update the x-axis.
      g.select(".x.axis")
          .attr("transform", "translate(0," + yScale.range()[0] + ")")
          .call(xAxis);

      // Update the y-axis.
      g.select(".y.axis")
          .call(yAxis);

      // Draw the bars.
      var layer = g.selectAll(".layer")
        .data(function(d) { return d; })
        .enter().append("g")     // TODO: is enter() appropriate here? How do we update/remove?
        .attr("class", "layer")
        .style("fill", function(d, i) { return color(i); });

      var rect = layer.selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")  // TODO: is enter() appropriate here? How do we update/remove?
        .attr("x", function(d, i, j) { return X(d) + xScale.rangeBand() / data.length * j; })
        .attr("y", function(d) { return Y(d); })
        .attr("width", xScale.rangeBand() / data.length)
        .attr("height", function(d) { return height - Y(d); });

    });
  }

  // The x-accessor for the path generator; xScale ∘ xValue.
  function X(d) {
    return xScale(d[0]);
  }

  // The x-accessor for the path generator; yScale ∘ yValue.
  function Y(d) {
    return yScale(d[1]);
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return xValue;
    xValue = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return yValue;
    yValue = _;
    return chart;
  };

  return chart;
}



// ================== DATA ===============================

/**
 Returns outcome -> (year -> freq)
 i.e. "outcome" is accepted/pending/expired
*/
function getSeries_outcomes(){
  var cluster = eqip.boseClusters[0].members;

  // get pFams
  var pFams = cluster.map(function(pId) {
                var p = eqip.bosePatFams[pId];
                if (!p) { console.log("MISSING patFam: id=" + pId); }
                return p;
              }).filter(function(p) { return p != null; });

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
  var yearsArr = d3.keys(yearsSet).sort();
  var years = d3.range(+yearsArr[0], +yearsArr[yearsArr.length - 1] + 1);

  // Transform histograms to series
  var series = ["priority_accepted", "priority_pending", "priority_expired"].map(function(s) {
    return {
      name: s,
      series: years.map(function(year) { return {x: year, y: counts[s][year] ? counts[s][year] : 0 }; })
    };
  });
  
  return series;
}

/**
 Returns cluster -> (year -> freq)
*/
function getSeries_cluster() {
  // get pFams per cluster
  var clusters = eqip.boseClusters.reduce(function(acc, c, i) {
    var pFams = c.members.map(function(pId) {
      var p = eqip.bosePatFams[pId];
      if (!p) { console.log("MISSING patFam: id=" + pId); }
      return p; 
    });
    pFams = pFams.filter(function(p) { return p != null; }); // remove nulls
    var name = "Cluster #" + i;
    acc[name] = pFams;
    return acc;
  }, {});

  // Construct histograms: cluster -> (year -> freq)
  var counts = d3.keys(clusters).reduce(function(acc, c) { acc[c] = {}; return acc; }, {}),
      yearsSet = {},
      inc = function(o, k) { o[k] = o[k] ? o[k] + 1 : 1; };
  d3.keys(clusters).forEach(function(c) {
    clusters[c].forEach(function(p) {
      var priYr = p.priorityDate.slice(0, 4);
      yearsSet[priYr] = true;
      inc(counts[c], priYr);
    });
  });

  // Calculate x domain (range of years)
  var yearsArr = d3.keys(yearsSet).sort();
  var years = d3.range(+yearsArr[0], +yearsArr[yearsArr.length - 1] + 1);

  // Transform histograms to series
  var series = d3.keys(counts).map(function(cluster) {
    return {
      name:   cluster,
      series: years.map(function(year) { return { x: year, y: counts[cluster][year] ? counts[cluster][year] : 0 }; })
    }; 
  });

  return series;
}

/**
 Returns company -> (year -> freq)
 i.e. companies are bose, hiwave etc...
*/
function getSeries_company() {

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
  
  // Get pFams per company
  var bose_pFams   = d3.values(eqip.bosePatFams);
  var hiwave_pFams = d3.values(eqip.hiwavePatfams);
  var companies = {
    "Bose"            : bose_pFams,
    "Hiwave"          : hiwave_pFams,
    "global Omnicorp" : getFakeData(bose_pFams),
    "Acme LLC"        : getFakeData(bose_pFams)
  };

  // Construct histograms: company -> (year -> freq)
  var counts = d3.keys(companies).reduce(function(acc, d) { acc[d] = {}; return acc; }, {}),
      yearsSet = {},
      inc = function(o, k) { o[k] = o[k] ? o[k] + 1 : 1; };
  d3.keys(companies).forEach(function(c) {
    companies[c].forEach(function(p) {
      var priYr = p.priorityDate.slice(0, 4);
      yearsSet[priYr] = true;
      inc(counts[c], priYr);
    });
  });

  // Calculate x domain (range of years)
  var yearsArr = d3.keys(yearsSet).sort();
  var years = d3.range(+yearsArr[0], +yearsArr[yearsArr.length - 1] + 1);

  // Transform histograms to series
  var series = d3.keys(counts).map(function(company) {
    return {
      name: company,
      series: years.map(function(year) { return { x: year, y: counts[company][year] ? counts[company][year] : 0}; })
    };
  });

  return series;  
}


/*
 Simulate variation in Bose Cluster 0,
 by randomly removing some grant dates.
*/
function fakeMissingGrantDates(){
  var cluster = eqip.boseClusters[0].members;
  // remove grant date for the first and last quarters
  cluster.slice(0, Math.ceil(cluster.length / 4))
    .concat(cluster.slice(cluster.length - Math.ceil(cluster.length / 4)))
    .forEach(function(pId) {
      delete eqip.bosePatFams[pId].grantDate;
    });
}



