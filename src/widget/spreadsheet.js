/* global gadgets */

var RiseVision = RiseVision || {};
RiseVision.Spreadsheet = {};

RiseVision.Spreadsheet = (function (document, gadgets, utils, Visualization) {

  "use strict";

  // private variables
  var _prefs = null,
    _additionalParams = null,
    _spreadsheetContent = null,
    _initialLoad = true,
    _viz = null;

  function _ready() {
    gadgets.rpc.call("", "rsevent_ready", null, _prefs.getString("id"), true, true, true, true, true);
  }

  function _done() {
    gadgets.rpc.call("", "rsevent_done", null, _prefs.getString("id"));
  }

  function _configureVizData(data) {
    var empty = true,
      numOfRows, cellValue, indexCount, j;

    numOfRows = data.getNumberOfRows();
    indexCount = data.getNumberOfColumns() - 1;

    while (indexCount > -1) {
      for (j = 0; j < numOfRows; j += 1) {
        cellValue = data.getValue(j, indexCount);
        if (cellValue && cellValue !== "") {
          empty = false;
          break;
        }
      }

      if (empty) {
        // remove unused column
        data.removeColumn(indexCount);
      }

      empty = true;
      indexCount -= 1;
    }

    return data;
  }

  function _pause() {
    _spreadsheetContent.scrollPause();
  }

  function _play() {
    _spreadsheetContent.scrollPlay();
  }

  function _onVizDataLoaded(data) {
    var vizData = null;

    if (!data) {
      if (_initialLoad) {
        _initialLoad = false;
        _ready();
      }
    } else {
      vizData = _configureVizData(data);

      _spreadsheetContent.build(vizData);

      if (_initialLoad) {
        _initialLoad = false;
        _ready();
      } else {
        _play();
      }
    }
  }

  function _getData(url) {
    if (url) {
      _additionalParams.spreadsheet.url = url;
    }

    _viz.getData({
      url: _additionalParams.spreadsheet.url,
      refreshInterval: _additionalParams.spreadsheet.refresh * 60,
      callback: _onVizDataLoaded
    });
  }

  function _setParams(names, values) {
    var fontSettings;

    // create spreadsheet content instance
    if (!_spreadsheetContent) {
      _spreadsheetContent = new RiseVision.Spreadsheet.Content();
    }

    // create visualization instance
    if (!_viz) {
      _viz = new Visualization();
    }

    _prefs = new gadgets.Prefs();

    if (Array.isArray(names) && names.length > 0 && names[0] === "additionalParams") {
      if (Array.isArray(values) && values.length > 0) {
        _additionalParams = $.extend({}, JSON.parse(values[0]));

        // return the column ids to the actual id values in the spreadsheet
        $.each(_additionalParams.columns, function (index, column) {
          column.id = column.id.slice(0, (column.id.indexOf("_")));
        });

        // set the document background with value saved in settings
        document.body.style.background = _additionalParams.background.color;

        // Load Fonts
        fontSettings = [
          {
            "class": "heading_font-style",
            "fontSetting": _additionalParams.table.colHeaderFont
          },
          {
            "class": "data_font-style",
            "fontSetting": _additionalParams.table.dataFont
          }
        ];

        utils.loadFonts(fontSettings);

        //Inject CSS into the DOM
        utils.addCSSRules([
          "a:active" + utils.getFontCssStyle("data_font-style", _additionalParams.table.dataFont),
          ".even {background-color: " + _additionalParams.table.rowColor + "}",
          ".odd {background-color: " + _additionalParams.table.altRowColor + "}"
        ]);

        // initialize the spreadsheet content with settings data and pass the _done handler function
        _spreadsheetContent.initialize(_prefs, _additionalParams, _done);

        // Load the arrow images
        RiseVision.Spreadsheet.Arrows.load(function () {
          _getData();
        });
      }
    }
  }

  return {
    setParams: _setParams,
    getData: _getData,
    pause: _pause,
    play: _play
  };

})(document, gadgets, RiseVision.Common.Utilities, RiseVision.Common.Visualization);


