/*
 * XyzAPI References
 *
 * WebIDL:
 *
**/

var fuzzerXyz = (function() {
  /*
  ** Initialization
  ** Commands which shall be called at the beginning of a testcase.
  */
  function onInit()
  {
    var cmd = [];

    return cmd;
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    var cmd = [];

    return cmd;
  }

  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    var cmd = [];

    return cmd;
  }

  /*
  ** Methods and attributes.
  */
  var ObjectMethods = {
    "name": []
  };

  var ObjectAttributes = {
    "name": function() { },
  };

  var Events = {
    "object_name": ['name'],
  };

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish,
    Events: Events
  };
})();

