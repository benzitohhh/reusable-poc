var eqip   = eqip || {};
eqip.model = eqip.model || {};
var series = eqip.model.series = eqip.model.series || {};

// Returns (outcome -> (year -> freq)).
series.registrationsPerYearPerOutcome = function(pFams) {

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
