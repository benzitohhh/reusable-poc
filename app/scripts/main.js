// ================= CLIENT =============================
fakeMissingGrantDates();
var outcomes = getSeries_outcomes();
var cluster = getSeries_cluster();
var company = getSeries_company();

d3.select("#outcome-chart")
  .datum(outcomes.series)  // bind data to selection
 .call(reg()
    .labels(outcomes.labels)
    .colors({1: "#f39c12"})
    .title("Bose (Cluster #1): Registrations per Year, by Outcome")
    .stacked(true)
    .transition(true)
 );

// d3.select("#cluster-chart")
//   .datum(cluster.series)  // bind data to selection
//   .call(reg()
//     .labels(cluster.labels)
//     .colors(["#000000", "#00FF00", "#FF6600", "#3399FF"])
//     .title("Bose: Registrations per Year, by Cluster")
//     .stacked(true)
//     .trans(true)
//   );

// var myChart = reg()
//                 .labels(company.labels)
//                 .title("Bose & Peers: Registrations per Year, by Company")
//                 .trans(true);

// d3.select("#company-chart")
//   .datum(company.series)  // bind data to selecti 
//   .call(myChart);

// setInterval(function() {
//     // Update (with new fake data)
//     d3.select("#company-chart")
//       .datum(getSeries_company().series)
//       .call(myChart);
//     }, 10000);


// ================== CHART ==============================
function reg() {
  // see http://bost.ocks.org/mike/chart/
  // BASICALLY: implement reusable components as closures with getter-setter methods

  var margin      = {top: 40, right: 150, bottom: 30, left: 40},
      width       = 600 - margin.left - margin.right,
      height      = 400 - margin.top - margin.bottom,
      labels      = [],
      title       = "",
      colors      = [],
      transition  = false,
      stacked     = false,
      defCol      = d3.scale.linear().range(["#00f", "#f00"]),
      xValue      = function(d) { return d.x; }, // default x-accessor
      yValue      = function(d) { return d.y; }, // default y-accessor
      xScale      = d3.scale.ordinal().rangeRoundBands([0, width], 0.5),
      yScale      = d3.scale.linear().rangeRound([height, 0]),
      xAxis       = d3.svg.axis().scale(xScale)
                                 .ticks(10)
                                 .tickSubdivide(0) // don't show decimals
                                 .outerTickSize(0) // don't show outer ticks
                                 .orient("bottom"),
      yAxis       = d3.svg.axis()
                          .scale(yScale)
                          .orient("left")
                          .tickFormat(d3.format("d"))
                          .tickSize(-width) // extend ticks out, so they become grid lines
                          .tickPadding(6)   // leave some space near labels
                          .tickSubdivide(0); // don't show decimals

  function chart(selection) {
    selection.each(function(data) {

      // Convert data to standard representation greedily;
      // this is needed for nondeterministic accessors.
      data = data.map(function(s) {
        return s.map(function(d, i) {
          return [xValue.call(s, d, i), yValue.call(s, d, i)]; 
        });
      });

      if (stacked) {
        // Stacked view, so add y0 (baseline)
        var stack = d3.layout.stack()
            .x(function(d) { return d[0]; })
            .y(function(d) { return d[1]; });
        data = stack(data);
      }

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
      var maxY = d3.max(data_flat, function(d) { return stacked ? d.y0 + d.y : d[1]; }); 
      yScale
          .domain([0, maxY])
          .rangeRound([height, 0]);
      var yTicks = yScale.ticks().filter(function(d, i) { return d % 1 === 0; }); // remove non-integers
      yAxis.tickValues(yTicks);

      // Update default color scale.
      defCol.domain([0, data.length - 1]);

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]); // BEN: see http://stackoverflow.com/questions/14665786/some-clarification-on-reusable-charts

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg").append("g");
      gEnter.append("g").attr("class", "x axis");
      gEnter.append("g").attr("class", "y axis");
      gEnter.append("g").attr("class", "legend");
      gEnter.append("text")
        .attr("class", "chart-title")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle");

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

      // Update the title.
      g.select(".chart-title")
          .text(title);

      // Set the legend.
      var legend = g.select(".legend").selectAll("g")
          .data(labels)
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(" + (margin.right) + "," + i * 20 + ")"; });
      
      legend.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", C);
      
      legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) {
            return d;
          });

      // Draw the bars.
      var layer = g.selectAll(".layer")
        .data(function(d) { return d; });

      layer.enter().append("g")
        .attr("class", "layer")
        .style("fill", C);

      var rect = layer.selectAll("rect")
        .data(function(d) { return d; });

      var rectEnter = rect.enter().append("rect")
        .attr("height", 0);

      if (stacked) {
        // stacked
        rectEnter
          .attr("x", function(d) { return X(d); })
          .attr("y", function(d) { return Y0(d); })
          .attr("width", xScale.rangeBand())
          .attr("height", 0);
      } else {
        // grouped
        rectEnter
          .attr("x", function(d, i, j) { return X(d) + xScale.rangeBand() / data.length * j; })
          .attr("y", function(d) { return yScale(0); })
          .attr("width", xScale.rangeBand() / data.length)
          .attr("height", 0);
      }

      if (transition) {
        rect = rect.transition().duration(500).delay(function(d, i, j) { return j * 1000; });
      }

      if (stacked) {
        // stacked
        rect
          .attr("x", function(d) { return X(d); })
          .attr("y", function(d) { return Y1(d); })
          .attr("width", xScale.rangeBand())
          .attr("height", function(d) { return yScale(d.y0) - yScale(d.y0 + d.y); });
      } else {
        // grouped
        rect
          .attr("x", function(d, i, j) { return X(d) + xScale.rangeBand() / data.length * j; })
          .attr("y", function(d) { return Y(d); })
          .attr("width", xScale.rangeBand() / data.length)
          .attr("height", function(d) { return height - Y(d); });
      }

    });
  }

  // x-accessor for drawing
  function X(d) {
    return xScale(d[0]);
  }

  // y-accessor for drawing
  function Y(d) {
    return yScale(d[1]);
  }

  // y0-accessor for drawing (stack - layer base)
  function Y0(d) {
    return yScale(d.y0);
  }

  // y1-accessor for drawing (stack - layer top)
  function Y1(d) {
    return yScale(d.y0 + d.y);
  }

  // color-accessor for drawing
  function C(d, i) {
    return colors[i] ? colors[i] : defCol(i); // if user-defined color exists use it, otherwise default
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

  chart.labels = function(_) {
    if (!arguments.length) return labels;
    labels = _;
    return chart;
  };

  chart.title = function(_) {
    if (!arguments.length) return title;
    title = _;
    return chart;
  };

  chart.colors = function(_) {
    if (!arguments.length) return colors;
    colors = _;
    return chart;
  };

  chart.transition = function(_) {
    if (!arguments.length) return transition;
    transition = _;
    return chart;
  };

  chart.stacked = function(_) {
    if (!arguments.length) return stacked;
    stacked = _;
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

  var labels = {
    "priority_accepted": "accepted", 
    "priority_pending":  "pending",
    "priority_expired":  "expired"
  };

  // Transform histograms to series
  var series = d3.keys(labels).map(function(s) {
    return years.map(function(year) { return {x: year, y: counts[s][year] ? counts[s][year] : 0 }; });
  });
  
  return { series: series, labels: d3.values(labels) };
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
    var name = "Cluster #" + (i + 1);
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
    return years.map(function(year) { return { x: year, y: counts[cluster][year] ? counts[cluster][year] : 0 }; }); 
  });

  return { series: series, labels: d3.keys(clusters) };
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
    "Global Omnicorp" : getFakeData(bose_pFams),
    "Patently Obvious PLC" : getFakeData(bose_pFams),
    "Kinda Big Deal inc." : getFakeData(bose_pFams),
    "Holding Holdings" : getFakeData(bose_pFams),
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
    return years.map(function(year) { return { x: year, y: counts[company][year] ? counts[company][year] : 0}; });
  });

  return { series: series, labels: d3.keys(companies) };  
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



