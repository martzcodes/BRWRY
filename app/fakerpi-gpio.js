//may or may not work
//For testing on something other than a pi (vagrant machine, for instance)
//doesn't really do anything... just setups the functions so brwry code has something to call.

//need setup, write, read, DIR_OUT, destroy

var util   = require('util'),
    EventEmitter = require('events').EventEmitter;

// Constructor
function Gpio() {
    
}
util.inherits(Gpio, EventEmitter);

// Constants
Gpio.prototype.DIR_IN  = 'in';
Gpio.prototype.DIR_OUT = 'out';

/**
 * Setup a channel for use as an input or output
 *
 * @param {number}   channel   Reference to the pin in the current mode's schema
 * @param {string}   direction The pin direction, either 'in' or 'out'
 * @param {function} cb        Optional callback
 */
Gpio.prototype.setup = function(channel, direction, cb) {
    //don't really need to do anything... may store values later
    cb();
};

/**  
 * Write a value to a channel
 *
 * @param {number}   channel The channel to write to
 * @param {boolean}  value   If true, turns the channel on, else turns off
 * @param {function} cb      Optional callback
 */
Gpio.prototype.write = function(channel, value, cb) {
    //don't really need to do anything... may store values later
    cb();
};
Gpio.prototype.output = Gpio.prototype.write;

/**
 * Unexport any open pins
 *
 * @param {function} cb Optional callback
 */
Gpio.prototype.destroy = function(cb) {
    //don't really need to do anything... may store values later
};

module.exports = new Gpio;