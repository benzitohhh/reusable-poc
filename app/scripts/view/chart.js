// see http://bost.ocks.org/mike/chart/
// BASICALLY: implement reusable components as closures with getter-setter methods

(function() {

  // import utils
  var util = window.eqip.util.util; // TODO: clean this up!

  function baseChart() {
    var margin       = {top: 40, right: 150, bottom: 30, left: 40},
        width        = 600 - margin.left - margin.right,
        height       = 400 - margin.top - margin.bottom,
        title        = "",
        labels       = [],
        colors       = [],
        hide         = {},
        transition   = false,
        yHorizontal  = false,
        stacked      = false,
        stackOffset  = "zero",
        defCol       = d3.scale.linear().range(["#00f", "#f00"]),
        xValue       = function(d) { return d.x; }, // default x-accessor
        yValue       = function(d) { return d.y; }, // default y-accessor
        xScale       = d3.scale.ordinal().rangeRoundBands([0, width], 0.5),
        yScale       = d3.scale.linear().rangeRound([height, 0]),
        xAxis        = d3.svg.axis().scale(xScale)
          .ticks(10)
          .tickSubdivide(0) // don't show decimals
          .outerTickSize(0) // don't show outer ticks
          .orient("bottom"),
        yAxis        = d3.svg.axis()
          .scale(yScale)
          .orient("left")
          .tickFormat(d3.format("d"))
          .tickSize(-width) // extend ticks out, so they become grid lines
          .tickPadding(6)   // leave some space near labels
          .tickSubdivide(0), // don't show decimals
        stack        = d3.layout.stack()
          .x(function(d) { return d[0]; })
          .y(function(d) { return d[1]; }),
        render_data  = function(layer, chart, data) {},
        updateXScaleAndXAxis = function(scale, axis, data, length) {},
        updateYScaleAndYAxis = function(scale, axis, data, length) {};

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
          // Stack all series (including hidden ones)
          stack.offset(stackOffset);
          data = stack(data);
        }

        // default scales
        var xRange = yHorizontal ? [height, 0] : [0, width];
        var yRange = yHorizontal ? [0, width]  : [height, 0];
        xScale.rangeRoundBands(xRange, 0.5);
        yScale.rangeRound(yRange);
        
        // Update scales / axis.
        var xData = data.map(function(s) { return s.map(function(d) { return d[0]; }); });
        var yData = data.map(function(s) { return s.map(function(d) { return stacked ? d.y0 + d.y : d[1]; }); });
        updateXScaleAndXAxis(xScale, xAxis, xData, yHorizontal ? height : width);
        updateYScaleAndYAxis(yScale, yAxis, yData, yHorizontal ? width: height);
        if (yHorizontal) {
          xAxis.orient("left");
          yAxis.orient("top");
        }

        if (stacked) {
          // Now that axes and scales have been set (including min/max stack values),
          // re-stack excluding hidden series
          var sData = data.map(function(s, i) {
            return !hide[i] ? s : s.map(function(d) { return [d[0], 0]; });  // hidden series get y = 0
          });
          data = stack(sData); // Add y0 (baseline)
        }

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

        // Legend: Bind data
        var lgnds = g.select(".legend").selectAll(".legend-element")
              .data(labels);

        // Legend: update labels (i.e. to denote show/hide series)
        lgnds.select("rect")
          .style("fill", function(d, i) {
            var myCol = hide[i] ? "#ffffff" : C(d, i);
            return myCol;
          });

        // Legend: append labels (if they do not already exist)
        var lgnds_enter = lgnds.enter().append("g")
              .attr("class", "legend-element")
              .attr("transform", function(d, i) { return "translate(" + (margin.right) + "," + i * 20 + ")"; });
        lgnds_enter.append("rect")
          .attr("x", width - 18)
          .attr("width", 16)
          .attr("height", 16)
          .style("fill", function(d, i) { return hide[i] ? "#ffffff" : C(d, i); })
          .style("stroke", C)
          .style("stroke-width", 2);
        lgnds_enter.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) {
            return d;
          });
        lgnds_enter.on("click", function(d, i) {
          chart.hide()[i] = !chart.hide()[i];
          chart(selection);
        });
        
        // Layers (one per series): select, bind data, and append if not already existing.
        var layer = g.selectAll(".layer").data(function(d) { return d; });
        layer.enter().append("g")
          .attr("class", "layer");

        // Render data
        render_data(layer, chart, data);
      });
    }

    // x-accessor for drawing
    function X(d) {
      return xScale(d[0]);
    };

    // y-accessor for drawing
    function Y(d) {
      return yScale(d[1]);
    };

    // y0-accessor for drawing (stack - layer base)
    function Y0(d) {
      return yScale(d.y0);
    };

    // y1-accessor for drawing (stack - layer top)
    function Y1(d) {
      return yScale(d.y0 + d.y);
    };

    // color-accessor for drawing
    function C(d, i) {
      return colors[i] ? colors[i] : defCol(i); // if user-defined color exists use it, otherwise default
    };

    function hideYAxisLabels() {
      yAxis.tickFormat("");
    } 

    // Public functions (exposed for use in renders etc...)
    chart.X  = X;
    chart.Y  = Y;
    chart.Y0 = Y0;
    chart.Y1 = Y1;
    chart.C  = C;
    chart.xScale = xScale;
    chart.yScale = yScale;

    // Getter/Setters (return chart, which is convenient for chaining)
    // These are used internally (i.e. within renders) AND externally (chaining).
    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };
    chart.marginLeft = function(_) {
      if (!arguments.length) return margin.left;
      margin.left = _;
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
    chart.hide = function(_) {
      if (!arguments.length) return hide;
      hide = _;
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
    chart.yHorizontal = function(_) {
      if (!arguments.length) return yHorizontal;
      yHorizontal = _;
      return chart;
    };
    chart.stacked = function(_) {
      if (!arguments.length) return stacked;
      stacked = _;
      return chart;
    };
    chart.render_data = function(_) {
      if (!arguments.length) return render_data;
      render_data = _;
      return chart;
    };
    chart.updateXScaleAndXAxis = function(_) {
      if (!arguments.length) return updateXScaleAndXAxis;
      updateXScaleAndXAxis = _;
      return chart;
    };
    chart.updateYScaleAndYAxis = function(_) {
      if (!arguments.length) return updateYScaleAndYAxis;
      updateYScaleAndYAxis = _;
      return chart;
    };
    chart.xAxis = function(_) {
      if (!arguments.length) return xAxis;
      xAxis = _;
      return chart;
    };
    chart.yAxis = function(_) {
      if (!arguments.length) return yAxis;
      yAxis = _;
      return chart;
    };
    chart.stackOffset = function(_) {
      if (!arguments.length) return stackOffset;
      stackOffset = _;
      return chart;
    };
    
    // Setters (not getters). Sets val regardless of whether args provided or not.
    chart.column = function() { 
      render_data = render_data_column;
      return chart;
    };    
    chart.area = function() { 
      stacked = true;
      render_data = render_data_line;
      return chart;
    };
    chart.line = function() { 
      stacked = false;
      render_data = render_data_line;
      return chart;
    };    
    chart.stack = function() { 
      stacked = true;
      return chart;
    };
    chart.group = function() {
      stacked = false;
      return chart;
    };
    chart.stream = function(_) {
      if (_ || (!arguments.length)) {
        hideYAxisLabels();
        stackOffset =  "wiggle";
      } else {
        stackOffset = "zero";
      }
      return chart;
    };    
    chart.streamRel = function(_) {
      if (_ || (!arguments.length)) {
        hideYAxisLabels();
        stackOffset =  "expand";
      } else {
        stackOffset = "zero";
      }
      return chart;
    };
    chart.streamCtr = function(_) {
      if (_ || (!arguments.length)) {
        hideYAxisLabels();
        stackOffset =  "silhouette";
      } else {
        stackOffset = "zero";
      }
      return chart;
    };
    chart.hideYAxisLabels = function() {
      hideYAxisLabels();
      return chart;
    };

    return chart;
  } // end of baseChart

  /**
   * Renders rects for column charts (both stacked and grouped).
   */
  function render_data_column(layerSelection, chart, data) {
    // Set fill for layer.
    layerSelection.style("fill", chart.C);

    // Select the rects, and bind data.
    var rect = layerSelection.selectAll("rect").data(function(d) { return d; });

    // If they don't exist yet, append them.
    var rectEnter = rect.enter().append("rect");
    if (chart.stacked()) {
      // stacked
      if (chart.yHorizontal()) {
        // TODO:
        rectEnter
          .attr("x", 0)
          .attr("y", function(d) { return chart.X(d); })
          .attr("width", 0)
          .attr("height", chart.xScale.rangeBand());
      } else {
        rectEnter
          .attr("x", function(d) { return chart.X(d); })
          .attr("y", function(d) { return chart.Y0(d); })
          .attr("width", chart.xScale.rangeBand())
          .attr("height", 0);      
      }
    } else {
      // grouped
      if (chart.yHorizontal()) {
        // TODO:
      } else {
        rectEnter
          .attr("x", function(d, i, j) { return chart.X(d) + chart.xScale.rangeBand() / data.length * j; })
          .attr("y", function(d) { return chart.yScale(0); })
          .attr("width", chart.xScale.rangeBand() / data.length)
          .attr("height", 0);      
      }
    }

    if (chart.transition()) {
      if (rect.enter().empty()) {
        // Bars are already on-screen, so show fast transition.
        rect = rect.transition().duration(200);
      } else {
        // Bars are not yet on-screen, so show slower transition, with each series delayed individually.
        var idxExclHidden = [];
        var j = 0;
        data.forEach(function(d, i) {
          idxExclHidden.push(chart.hide()[i] ? 0 : j++); // hidden series excluded from delay (i.e. get index 0).
        });
        rect = rect.transition().duration(500).delay(function(d, i, j) { return idxExclHidden[j] * 500; });
      }
    }

    if (chart.stacked()) {
      // stacked
      if (chart.yHorizontal()) {
        rect
          .attr("x", 0)
          .attr("y", function(d) { return chart.X(d); })
          .attr("width", function(d) { return - chart.yScale(d.y0) + chart.yScale(d.y0 + d.y); })
          .attr("height", chart.xScale.rangeBand());
      } else {
        rect
          .attr("x", function(d) { return chart.X(d); })
          .attr("y", function(d) { return chart.Y1(d); })
          .attr("width", chart.xScale.rangeBand())
          .attr("height", function(d) { return chart.yScale(d.y0) - chart.yScale(d.y0 + d.y); });
      }
    } else {
      // grouped
      if (chart.yHorizontal()) {
        // TODO:
      } else {
        rect
          .attr("x", function(d, i, j) { return chart.X(d) + chart.xScale.rangeBand() / data.length * j; })
          .attr("y", function(d, i, j) { return chart.hide()[j] ? chart.yScale(0) : chart.Y(d); })
          .attr("width", chart.xScale.rangeBand() / data.length)
          .attr("height", function(d, i, j) { 
            return chart.hide()[j] ? 0 : chart.height() - chart.Y(d);
          });      
      }
    }
  }

  /**
   * Renders path for Line and Area charts (including stream charts).
   */
  function render_data_line(layerSelection, chart, data) {
    // Set fill for layer.
    if (chart.stacked()) {
      layerSelection
        .style("fill", chart.C)
        .style("stroke", "none")
        .style("stroke-width", "none");
    } else {
      layerSelection.style("fill", chart.C)
        .style("fill", "none")
        .style("stroke", chart.C)
        .style("stroke-width", function(d, i) { return chart.hide()[i] ? 0 : 2; });
    }

    var areaZero = d3.svg.area()
          .x(chart.X)
          .y0(chart.Y0)
          .y1(chart.Y0);
          
    var area = d3.svg.area()
          .x(chart.X)
          .y0(chart.Y0)
          .y1(chart.Y1);

    var line = d3.svg.line()
          .x(chart.X)
          .y(chart.Y);

    var lineZero = d3.svg.line()
          //.x(chart.xScale(0))
          .y(chart.yScale(0));

    // Select path element (per layer)
    var path = layerSelection.select("path").data(function(d) { return d; });

    // If they don't exist, then this is the first time that chart is being rendered.
    var init = !path.enter().empty();

    // PROBLEM:  On initialise, path.enter() is non-empty.
    //           But it will append() to the container, rather than the g.layer
    // SOLUTION: Append to the layerSelection (rather than to layerSelection.select("path").data(..).enter())
    //           Then reset the reference

    if (init) {
      // Path elements do not exist yet, so append them.
      layerSelection.append("path")
        .attr("d", chart.stacked() ? areaZero : lineZero);

      // reset selection reference (see workround note above)
      path = layerSelection.select("path");
    }

    if (chart.transition()) {
      if (!init) {
        // Paths are already onscreen, so set fast transition.
        path = path.transition().duration(200);
      } else {
        // Paths are not yet onscreen, so set slower transition, with each series delayed individually.
        var idxExclHidden = [];
        var j = 0;
        data.forEach(function(d, i) {
          idxExclHidden.push(chart.hide()[i] ? 0 : j++); // hidden series excluded from delay (i.e. get index 0).
        });
        path = path.transition().duration(500).delay(function(d, i) { return idxExclHidden[i] * 500; });
      }      
    }

    // Update path
    path.attr("d", chart.stacked() ? area : line);
  }

  /**
   * Scale/Axis linear (integers).
   */
  var updateScaleAndAxis_linear = function(scale, axis, data, length) {
    // get max (using values from ALL series)
    var data_flat = util.flatten(data);
    var maxVal = d3.max(data_flat); 
    scale
      .domain([0, maxVal]);
      //.rangeRound([chart.height(), 0]); // TODO: is this necessary? If not, remove!
    var ticks = scale.ticks().filter(function(d, i) { return d % 1 === 0; }); // remove non-integers
    axis.tickValues(ticks);
  };

  /**
   * Scale/Axis ordinal.
   */
  var updateScaleAndAxis_ordinal = function(scale, axis, data, length) {
    // Only use data from 1st series (assumes "stackability").
    scale.domain(data[0]);
  };

  /**
   * Scale/Axis ordinal year-range.
   */
  var updateScaleAndAxis_ordinal_years = function(scale, axis, data, length, reverse) {
    // Only use data from 1st series (assumes "stackability").
    var domain = data[0];
    var range = reverse ? [length, 0] : [0, length];
    scale
      .domain(domain)
      .rangeRoundBands(range, 0.5);
    if (domain.length > 10) {
      // Restrict number of ticks, to ensure that year labels do not overlap.
      // In general, we only have space for approximately 10 labels
      var divisor  = Math.ceil(domain.length / 10);
      var startIdx = domain[0] % 5 ? (5 - domain[0] % 5) : 0; // first index whose val is a multiple of 5
      var subset   = domain.filter(function(d, i) { return (i - startIdx) % divisor == 0; });
      axis.tickValues(subset);
      // Use less padding (otherwise bars will be too narrow)
      scale.rangeRoundBands(range, 0.1);
    }
  };

  function registrationsChart() {
    return baseChart()
      .render_data(render_data_column)
      .updateXScaleAndXAxis(updateScaleAndAxis_ordinal_years)
      .updateYScaleAndYAxis(updateScaleAndAxis_linear)
      .stacked(true);
  }

  function portfolioChart(){
    return baseChart()
      .render_data(render_data_line)
      .updateXScaleAndXAxis(updateScaleAndAxis_ordinal_years)
      .updateYScaleAndYAxis(updateScaleAndAxis_linear)
      .stacked(true);  
  }

  function territoriesChart(){
    return baseChart()
      .yHorizontal(true)
      .marginLeft(60)
      .render_data(render_data_column)
      .updateXScaleAndXAxis(updateScaleAndAxis_ordinal)
      .updateYScaleAndYAxis(updateScaleAndAxis_linear)
      .stacked(true);  
  }

  // export
  var eqip              = this.eqip || {};
  eqip.view             = eqip.view || {};
  var ns                = eqip.view.chart = eqip.view.chart || {};
  ns.baseChart          = baseChart;
  ns.registrationsChart = registrationsChart;
  ns.portfolioChart     = portfolioChart;
  ns.territoriesChart   = territoriesChart;

})();






