"use strict";

/**
 * @constructor
 * @param {BusConnector} bus
 * @suppress {deprecated}
 */
function SpeakerAdapter(bus)
{
    if (typeof window === "undefined")
    {
        return;
    }

    /** @const @type {BusConnector} */
    this.bus = bus;

    this.audio_context = new (window.AudioContext || window.webkitAudioContext)();

    this.beep_gain = this.audio_context.createGain();
    this.beep_gain.gain.value = 0;
    this.beep_gain.connect(this.audio_context.destination);

    this.beep_oscillator = this.audio_context.createOscillator();
    this.beep_oscillator.type = 'square';
    this.beep_oscillator.frequency.value = 440;
    this.beep_oscillator.connect(this.beep_gain);
    this.beep_oscillator.start();

    this.beep_playing = false;
    this.beep_enable = false;
    this.beep_frequency = 440;
    this.pit_enabled = false;

    bus.register("pcspeaker-enable", function(yesplease)
    {
        this.beep_enable = yesplease;
        this.beep_update();
    }, this);

    bus.register("pcspeaker-update", function(pit)
    {
        this.pit_enabled = pit.counter_mode[2] == 3;
        this.beep_frequency = OSCILLATOR_FREQ * 1000 / pit.counter_reload[2];
        this.beep_update();
    }, this);
}

SpeakerAdapter.prototype.beep_update = function()
{
    var current_time = this.audio_context.currentTime;

    if(this.pit_enabled && this.beep_enable)
    {
        this.beep_oscillator.frequency.setValueAtTime(this.beep_frequency, current_time);
        if(!this.beep_playing)
        {
            this.beep_gain.gain.setValueAtTime(1, current_time);
            this.beep_playing = true;
        }
    }
    else if(this.beep_playing)
    {
        this.beep_gain.gain.setValueAtTime(0, current_time);
        this.beep_playing = false;
    }
}