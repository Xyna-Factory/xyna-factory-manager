/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { ApiService, RuntimeContext, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogService, XcFormDirective, XcIdentityDataWrapper, XcStringIntegerDataWrapper } from '@zeta/xc';

import { FM_RTC, FM_WF_GET_TIMEZONES, GET_TIMEZONE_EMPTY_ERROR, UNSPECIFIED_GET_TIMEZONE_ERROR } from '../../../const';
import { XoOrderExecutionTime } from '../../../xo/xo-orderexecutiontime.model';
import { XoTimeUnit, XoTimeUnitArray } from '../../../xo/xo-timeunit.model';
import { XoRestrictionBasedTimeWindow } from '../../../xo/xo-timewindow.model';
import { XoTimezoneArray } from '../../../xo/xo-timezone.model';
import { ExecutionTimeInterval, ExecutionTimeMonth, ExecutionTimeMonthlyAtWhichDayOfTheMonth, ExecutionTimeMonthlyBy, ExecutionTimeWeekday, ExecutionTimeWeekdayPositionInMonth, ExecutionTimeYearlyBy, ExecutionTypes, WindowLengths } from './execution-time.constant';


@Component({
    selector: 'execution-time',
    templateUrl: './execution-time.component.html',
    styleUrls: ['./execution-time.component.scss'],
    standalone: false
})
export class ExecutionTimeComponent {
    @ViewChild(XcFormDirective, { static: false })
    xcFormDirective: XcFormDirective;

    @Output()
    private readonly invalidChange = new EventEmitter<boolean>();
    @Output()
    private readonly executionTimeChange = new EventEmitter<XoOrderExecutionTime>();

    /** Changes the header of the xc-panel */
    @Input() header: string;

    /** @description Decides if the form can have a time window and therefore a:
     *  - execution type
     *  - window length
     *  - end time
     * @usecase Using this component to build a TCOExecutionRestriction, you need a time window.
     */
    @Input() hasTimeWindow: boolean;

    private _executionTime: XoOrderExecutionTime;
    private _year: number;
    private _month: number;
    private _date: number;
    private _hours: number;
    private _minutes: number;
    private _seconds: number;
    private _milliseconds: number;
    private _intervalValue: string;
    private _yearlyByDateDayValue: string;
    private _customWindowLengthYYYY: number;
    private _customWindowLengthMM: number;
    private _customWindowLengthDD: number;
    private _customWindowLengthhh: number;
    private _customWindowLengthmm: number;
    private _customWindowLengthss: number;
    private _noEndTime: boolean;

    intervalUnit: string;

    timeZoneDataWrapper: XcAutocompleteDataWrapper;

    windowLengthDataWrapper: XcAutocompleteDataWrapper<WindowLengths>;
    windowLengthSelection: WindowLengths;

    intervalValueIdentityDataWrapper: XcIdentityDataWrapper;
    intervalWeekday: string;
    intervalDataWrapper: XcAutocompleteDataWrapper;
    ExecutionTimeInterval = ExecutionTimeInterval; // make enum usable in the VIEW - needed for ngSwitchCases

    // weekdayDataWrapper: XcAutocompleteDataWrapper;
    weekdayCheckboxValues = {};
    weekdaysArray = Object.keys(ExecutionTimeWeekday).map(key => ExecutionTimeWeekday[key]);
    weekdayCheckboxLabels = {};

    ExecutionTimeMonthlyBy = ExecutionTimeMonthlyBy;
    monthlyByDataWrapper: XcAutocompleteDataWrapper;
    monthlyBySwitchValue: string;

    ExecutionTimeMonthlyAtWhichDayOfTheMonth = ExecutionTimeMonthlyAtWhichDayOfTheMonth;
    atWhichDayOfTheMonthDataWrapper: XcAutocompleteDataWrapper;
    atWhichDaySwitchValue: string;
    atWhichDayValue: string;
    atWhichDayValueIdentityDataWrapper: XcIdentityDataWrapper;

    monthlyByWeekdayPositionValue: string;
    monthlyByWeekdayPositionDataWrapper: XcAutocompleteDataWrapper;

    monthlyByWeekdayWeekdayValue: string;
    monthlyByWeekdayWeekdayDataWrapper: XcAutocompleteDataWrapper;

    ExecutionTimeYearlyBy = ExecutionTimeYearlyBy;
    yearlyByDataWrapper: XcAutocompleteDataWrapper;
    yearlyBySwitchValue: string;

    yearlyByDateDayValueIdentityDateWrapper: XcIdentityDataWrapper;

    yearlyByDateMonthValue: string;
    yearlyByDateMonthDataWrapper: XcAutocompleteDataWrapper;

    yearlyByWeekdayPositionValue: string;
    yearlyByWeekdayPositionDataWrapper: XcAutocompleteDataWrapper;

    yearlyByWeekdayWeekdayValue: string;
    yearlyByWeekdayWeekdayDataWrapper: XcAutocompleteDataWrapper;

    yearlyByWeekdayMonthValue: string;
    yearlyByWeekdayMonthDataWrapper: XcAutocompleteDataWrapper;

    executionTypeDataWrapper: XcAutocompleteDataWrapper<ExecutionTypes>;
    executionType: ExecutionTypes = ExecutionTypes.ALWAYS;


    yearDataWrapper = new XcStringIntegerDataWrapper(
        () => this._year,
        (val: number) => {
            if (val !== this._year) {
                this._year = val;
                this._updateBoundObject();
            }
        }
    );

    monthDataWrapper = new XcStringIntegerDataWrapper(
        () => this._month,
        (val: number) => {
            if (val !== this._month) {
                this._month = val;
                this._updateBoundObject();
            }
        }
    );

    dateDataWrapper = new XcStringIntegerDataWrapper(
        () => this._date,
        (val: number) => {
            if (val !== this._date) {
                this._date = val;
                this._updateBoundObject();
            }
        }
    );

    hoursDataWrapper = new XcStringIntegerDataWrapper(
        () => this._hours,
        (val: number) => {
            if (val !== this._hours) {
                this._hours = val;
                this._updateBoundObject();
            }
        }
    );

    minutesDataWrapper = new XcStringIntegerDataWrapper(
        () => this._minutes,
        (val: number) => {
            if (val !== this._minutes) {
                this._minutes = val;
                this._updateBoundObject();
            }
        }
    );

    secondsDataWrapper = new XcStringIntegerDataWrapper(
        () => this._seconds,
        (val: number) => {
            if (val !== this._seconds) {
                this._seconds = val;
                this._updateBoundObject();
            }
        }
    );

    millisecondsDataWrapper = new XcStringIntegerDataWrapper(
        () => this._milliseconds,
        (val: number) => {
            if (val !== this._milliseconds) {
                this._milliseconds = val;
                this._updateBoundObject();
            }
        }
    );

    get yearlyByDateDayValue(): string {
        return this._yearlyByDateDayValue;
    }
    set yearlyByDateDayValue(value: string) {
        // use XcIdentityDataWrapper and call this._updateBoundObject(); like for millisecondsDataWrapper
        this._yearlyByDateDayValue = value;
    }

    get executionTime(): XoOrderExecutionTime {
        return this._executionTime;
    }

    @Input()
    set executionTime(value: XoOrderExecutionTime) {
        this._executionTime = value;
        // force to boolean
        this.executionTime.considerDST = !!this.executionTime.considerDST;
        this._updateComponentView();
    }

    get intervalValue(): string {
        return this._intervalValue;
    }

    set intervalValue(value: string) {
        this._intervalValue = value;
        // use XcIdentityDataWrapper and call this._updateBoundObject(); like for millisecondsDataWrapper
    }

    get invalid(): boolean {
        return this.xcFormDirective ? this.xcFormDirective.invalid : false;
    }

    get fmanRTC(): RuntimeContext {
        return FM_RTC;
    }

    get startTime(): number {
        return this.executionTime ? this.executionTime.startTime : -1;
    }

    set startTime(value: number) {
        if (this.executionTime) {
            this.executionTime.startTime = value;
        }
    }

    get noEndTime(): boolean {
        return this._noEndTime;
    }

    set noEndTime(value: boolean) {
        this._noEndTime = value;
        this.endTime = value ? null : -1;
    }

    private _endTime;

    get endTime(): number {
        return this._endTime;
    }

    set endTime(value: number) {
        this._endTime = value;
        this.executionTime.endTime = value;
    }

    get enableInterval(): boolean {
        return this.hasTimeWindow ? this.executionType === ExecutionTypes.TIME_WINDOW : true;
    }

    get allowCustomWindowLength(): boolean {
        return this.executionType === ExecutionTypes.TIME_WINDOW && this.windowLengthSelection === WindowLengths.OTHER;
    }

    /**
     * @description If the component has hasTimeWindow set to true, the time windo will be calculated.
     * @returns WindowLength in ms
     */
    get windowLength(): number {
        let timeInMillis = 0;
        if (this.windowLengthSelection) {
            switch (this.windowLengthSelection) {
                case WindowLengths['15MIN']:
                    timeInMillis = 900000;
                    break;
                case WindowLengths['30MIN']:
                    timeInMillis = 1800000;
                    break;
                case WindowLengths['1H']:
                    timeInMillis = 3600000;
                    break;
                case WindowLengths['1.5H']:
                    timeInMillis = 5400000;
                    break;
                case WindowLengths['2H']:
                    timeInMillis = 7200000;
                    break;
                case WindowLengths['3H']:
                    timeInMillis = 10800000;
                    break;
                case WindowLengths['4H']:
                    timeInMillis = 14400000;
                    break;
                case WindowLengths['6H']:
                    timeInMillis = 21600000;
                    break;
                case WindowLengths.OTHER:
                    timeInMillis += (this.customWindowLengthss || 0) * 1000;
                    timeInMillis += (this.customWindowLengthmm || 0) * 60000;
                    timeInMillis += (this.customWindowLengthhh || 0) * 3600000;
                    timeInMillis += (this.customWindowLengthDD || 0) * 86400000;
                    timeInMillis += (this.customWindowLengthMM || 0) * 2592000000;
                    timeInMillis += (this.customWindowLengthYYYY || 0) * 31556952000;
                    break;
            }
        }
        return timeInMillis ? timeInMillis : 1;
    }

    get customWindowLengthYYYY() {
        return this._customWindowLengthYYYY;
    }

    set customWindowLengthYYYY(value) {
        this._customWindowLengthYYYY = value;
        this._updateBoundObject();
    }

    get customWindowLengthMM() {
        return this._customWindowLengthMM;
    }

    set customWindowLengthMM(value) {
        this._customWindowLengthMM = value;
        this._updateBoundObject();
    }

    get customWindowLengthDD() {
        return this._customWindowLengthDD;
    }

    set customWindowLengthDD(value) {
        this._customWindowLengthDD = value;
        this._updateBoundObject();
    }

    get customWindowLengthhh() {
        return this._customWindowLengthhh;
    }

    set customWindowLengthhh(value) {
        this._customWindowLengthhh = value;
        this._updateBoundObject();
    }

    get customWindowLengthmm() {
        return this._customWindowLengthmm;
    }

    set customWindowLengthmm(value) {
        this._customWindowLengthmm = value;
        this._updateBoundObject();
    }

    get customWindowLengthss() {
        return this._customWindowLengthss;
    }

    set customWindowLengthss(value) {
        this._customWindowLengthss = value;
        this._updateBoundObject();
    }

    constructor(private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18nService: I18nService) {
        this.timeZoneDataWrapper = new XcAutocompleteDataWrapper(
            () => (this.executionTime ? this.executionTime.timezone : ''),
            (value: string) => {
                if (value !== this.executionTime.timezone) {
                    this.executionTime.timezone = value;
                    this._updateBoundObject();
                }
            }
        );

        this.executionTypeDataWrapper = new XcAutocompleteDataWrapper(
            () => this.executionType,
            (value: ExecutionTypes) => {
                this.executionType = value;
                this._updateBoundObject();
            },
            Object.values(ExecutionTypes).map(value => ({ name: this.i18nService.translate(value), value }))
        );

        this.windowLengthDataWrapper = new XcAutocompleteDataWrapper(
            () => this.windowLengthSelection,
            (value: WindowLengths) => {
                this.windowLengthSelection = value;
                this._updateBoundObject();
            },
            Object.values(WindowLengths).map(value => ({ name: this.i18nService.translate(value), value }))
        );

        this.apiService.startOrder(FM_RTC, FM_WF_GET_TIMEZONES, [], XoTimezoneArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe(result => {
            if (result && !result.errorMessage) {
                const tzArr = result.output[0] as XoTimezoneArray;
                if (tzArr) {
                    if (tzArr.length) {
                        this.timeZoneDataWrapper.values = tzArr.data.map(tz => ({ name: tz.label, value: tz.label }));
                    } else {
                        this.dialogService.error(this.i18nService.translate(GET_TIMEZONE_EMPTY_ERROR));
                    }
                } else {
                    this.dialogService.error(this.i18nService.translate(UNSPECIFIED_GET_TIMEZONE_ERROR));
                }
            } else {
                this.dialogService.error(result.errorMessage);
            }
        });

        this.intervalDataWrapper = new XcAutocompleteDataWrapper(
            () => this.intervalUnit,
            (value: string) => {
                if (value !== this.intervalUnit) {
                    this.intervalUnit = value;
                    this._updateBoundObject();
                }
            }
        );

        this.intervalDataWrapper.values = Object.keys(ExecutionTimeInterval).map(key => ({ name: ExecutionTimeInterval[key], value: ExecutionTimeInterval[key] }));

        this.intervalValueIdentityDataWrapper = new XcIdentityDataWrapper(
            () => this.intervalValue,
            (val: string) => {
                if (val !== this.intervalValue) {
                    this.intervalValue = val;
                    this._updateBoundObject();
                }
            }
        );

        Object.keys(ExecutionTimeWeekday).forEach(key => {
            Object.defineProperty(this.weekdayCheckboxValues, ExecutionTimeWeekday[key], { value: false, writable: true, configurable: true, enumerable: true });
            // Object.defineProperty(this.weekdayCheckboxKeys, key, {value: key, writable: true, configurable: true, enumerable: true});
            Object.defineProperty(this.weekdayCheckboxLabels, ExecutionTimeWeekday[key], { value: ExecutionTimeWeekday[key], writable: true, configurable: true, enumerable: true });
        });

        this.monthlyByDataWrapper = new XcAutocompleteDataWrapper(
            () => this.monthlyBySwitchValue,
            (value: string) => {
                if (value !== this.monthlyBySwitchValue) {
                    this.monthlyBySwitchValue = value;
                    this._updateBoundObject();
                }
            }
        );

        this.monthlyByDataWrapper.values = Object.keys(ExecutionTimeMonthlyBy).map(key => ({ name: ExecutionTimeMonthlyBy[key], value: ExecutionTimeMonthlyBy[key] }));

        this.atWhichDayOfTheMonthDataWrapper = new XcAutocompleteDataWrapper(
            () => this.atWhichDaySwitchValue,
            (value: string) => {
                if (value !== this.atWhichDaySwitchValue) {
                    this.atWhichDaySwitchValue = value;
                    this._updateBoundObject();
                }
            }
        );

        this.atWhichDayOfTheMonthDataWrapper.values = Object.keys(ExecutionTimeMonthlyAtWhichDayOfTheMonth).map(key => ({ name: ExecutionTimeMonthlyAtWhichDayOfTheMonth[key], value: ExecutionTimeMonthlyAtWhichDayOfTheMonth[key] }));

        this.atWhichDayValueIdentityDataWrapper = new XcIdentityDataWrapper(
            () => this.atWhichDayValue,
            (value: string) => {
                if (value !== this.atWhichDayValue) {
                    this.atWhichDayValue = value;
                    this._updateBoundObject();
                }
            }
        );

        this.monthlyByWeekdayPositionDataWrapper = new XcAutocompleteDataWrapper(
            () => this.monthlyByWeekdayPositionValue,
            (value: string) => {
                if (value !== this.monthlyByWeekdayPositionValue) {
                    this.monthlyByWeekdayPositionValue = value;
                    this._updateBoundObject();
                }
            }
        );

        this.monthlyByWeekdayPositionDataWrapper.values = Object.keys(ExecutionTimeWeekdayPositionInMonth).map(key => ({ name: ExecutionTimeWeekdayPositionInMonth[key], value: ExecutionTimeWeekdayPositionInMonth[key] }));

        this.monthlyByWeekdayWeekdayDataWrapper = new XcAutocompleteDataWrapper(
            () => this.monthlyByWeekdayWeekdayValue,
            (value: string) => {
                if (value !== this.monthlyByWeekdayWeekdayValue) {
                    this.monthlyByWeekdayWeekdayValue = value;
                    this._updateBoundObject();
                }
            }
        );

        this.monthlyByWeekdayWeekdayDataWrapper.values = Object.keys(ExecutionTimeWeekday).map(key => ({ name: ExecutionTimeWeekday[key], value: ExecutionTimeWeekday[key] }));

        this.yearlyByDataWrapper = new XcAutocompleteDataWrapper(
            () => this.yearlyBySwitchValue,
            (value: string) => (this.yearlyBySwitchValue = value)
        );

        this.yearlyByDataWrapper.values = Object.keys(ExecutionTimeYearlyBy).map(key => ({ name: ExecutionTimeYearlyBy[key], value: ExecutionTimeYearlyBy[key] }));

        this.yearlyByDateDayValueIdentityDateWrapper = new XcIdentityDataWrapper(
            () => this.yearlyByDateDayValue,
            (val: string) => {
                if (val !== this.yearlyByDateDayValue) {
                    this.yearlyByDateDayValue = val;
                    this._updateBoundObject();
                }
            }
        );

        this.yearlyByDateMonthDataWrapper = new XcAutocompleteDataWrapper(
            () => this.yearlyByDateMonthValue,
            (value: string) => {
                if (value !== this.yearlyByDateMonthValue) {
                    this.yearlyByDateMonthValue = value;
                    this._updateBoundObject();
                }
            }
        );

        this.yearlyByDateMonthDataWrapper.values = Object.keys(ExecutionTimeMonth).map(key => ({ name: ExecutionTimeMonth[key], value: ExecutionTimeMonth[key] }));

        this.yearlyByWeekdayPositionDataWrapper = new XcAutocompleteDataWrapper(
            () => this.yearlyByWeekdayPositionValue,
            (value: string) => {
                const update = value !== this.yearlyByWeekdayPositionValue;
                this.yearlyByWeekdayPositionValue = value;
                if (update) {
                    this._updateBoundObject();
                }
            }
        );

        this.yearlyByWeekdayPositionDataWrapper.values = Object.keys(ExecutionTimeWeekdayPositionInMonth).map(key => ({ name: ExecutionTimeWeekdayPositionInMonth[key], value: ExecutionTimeWeekdayPositionInMonth[key] }));

        this.yearlyByWeekdayWeekdayDataWrapper = new XcAutocompleteDataWrapper(
            () => this.yearlyByWeekdayWeekdayValue,
            (value: string) => {
                if (value !== this.yearlyByWeekdayWeekdayValue) {
                    this.yearlyByWeekdayWeekdayValue = value;
                    this._updateBoundObject();
                }
            }
        );

        this.yearlyByWeekdayWeekdayDataWrapper.values = Object.keys(ExecutionTimeWeekday).map(key => ({ name: ExecutionTimeWeekday[key], value: ExecutionTimeWeekday[key] }));

        this.yearlyByWeekdayMonthDataWrapper = new XcAutocompleteDataWrapper(
            () => this.yearlyByWeekdayMonthValue,
            (value: string) => {
                if (value !== this.yearlyByWeekdayMonthValue) {
                    this.yearlyByWeekdayMonthValue = value;
                    this._updateBoundObject();
                }
            }
        );

        this.yearlyByWeekdayMonthDataWrapper.values = Object.keys(ExecutionTimeMonth).map(key => ({ name: ExecutionTimeMonth[key], value: ExecutionTimeMonth[key] }));
    }

    private _updateComponentView() {
        this._readStartTimeFromObject();
        this._readIntervalAndItsValuesFromObject();
        if (this.hasTimeWindow) {
            this._readEndTimeFromObject();
            this._readWindowLengthFromObject();
        }
        this.timeZoneDataWrapper.update();
    }

    private _updateBoundObject() {
        this._writeStartTimeToObject();
        this._writeIntervalAndItsValuesToObject();
        this.executionTimeChange.emit(this.executionTime);
    }

    updateBoundObject() {
        this._updateBoundObject();
    }

    private _writeStartTimeToObject() {
        if (this.executionTime) {
            // handle this date as UTC, internally
            const date = new Date(0);
            date.setFullYear(this._year);
            date.setUTCMonth(this._month - 1, this._date);
            date.setUTCHours(this._hours, this._minutes, this._seconds, this._milliseconds);
            this.executionTime.startTime = date.getTime();
        }
    }

    private _readStartTimeFromObject() {
        if (this.executionTime) {
            // handle this date as UTC, internally
            const date = new Date(this.executionTime.startTime);
            this._year = date.getFullYear();
            this._month = date.getUTCMonth() + 1;
            this._date = date.getUTCDate();

            this._hours = date.getUTCHours();
            this._minutes = date.getUTCMinutes();
            this._seconds = date.getUTCSeconds();
            this._milliseconds = date.getUTCMilliseconds();
        }
    }

    private _readEndTimeFromObject() {
        if (this.executionTime) {
            if (this.executionTime.endTime) {
                this.endTime = this.executionTime.endTime;
            } else {
                this.noEndTime = true;
            }
        }
    }

    private _readWindowLengthFromObject() {
        if (this.executionTime) {
            this.executionType = this.intervalValue && this.intervalUnit ? ExecutionTypes.TIME_WINDOW : ExecutionTypes.ALWAYS;
            this.executionTypeDataWrapper.update();
            if (this.executionTime.timeWindow instanceof XoRestrictionBasedTimeWindow) {
                this.executionTime.timeWindow.duration.data.forEach(timePair => {
                    // Calculating the time unit in milliseconds
                    let multiplier = 1;
                    switch (timePair.unit) {
                        case 'Millis':
                            multiplier = 1;
                            break;
                        case 'Second':
                            multiplier = 1000;
                            break;
                        case 'Minute':
                            multiplier = 60000;
                            break;
                        case 'Hour':
                            multiplier = 3600000;
                            break;
                        case 'Day':
                            multiplier = 86400000;
                            break;
                    }
                    // Setting the time window dropdown
                    const windowLength = Number(timePair.value) * multiplier;
                    switch (windowLength) {
                        case 900000:
                            this.windowLengthSelection = WindowLengths['15MIN'];
                            break;
                        case 1800000:
                            this.windowLengthSelection = WindowLengths['30MIN'];
                            break;
                        case 3600000:
                            this.windowLengthSelection = WindowLengths['1H'];
                            break;
                        case 5400000:
                            this.windowLengthSelection = WindowLengths['1.5H'];
                            break;
                        case 7200000:
                            this.windowLengthSelection = WindowLengths['2H'];
                            break;
                        case 10800000:
                            this.windowLengthSelection = WindowLengths['3H'];
                            break;
                        case 14400000:
                            this.windowLengthSelection = WindowLengths['4H'];
                            break;
                        case 21600000:
                            this.windowLengthSelection = WindowLengths['6H'];
                            break;
                        default: {
                            this.windowLengthSelection = WindowLengths.OTHER;

                            // Calculating the custom time window length based on the value in milliseconds
                            let seconds = windowLength / 1000;
                            const year = Math.floor(seconds / 31556952);
                            const month = Math.floor((seconds % 31556952) / 2592000);
                            const day = Math.floor(((seconds % 31556952) % 2592000) / 86400);
                            const hour = Math.floor((((seconds % 31556952) % 2592000) % 86400) / 3600);
                            const minute = Math.floor(((((seconds % 31556952) % 2592000) % 86400) % 3600) / 60);
                            seconds = ((((seconds % 31556952) % 2592000) % 86400) % 3600) % 60;
                            this.customWindowLengthYYYY = year;
                            this.customWindowLengthMM = month;
                            this.customWindowLengthDD = day;
                            this.customWindowLengthhh = hour;
                            this.customWindowLengthmm = minute;
                            this.customWindowLengthss = seconds;
                            break;
                        }
                    }
                    this.windowLengthDataWrapper.update();
                });
            }
        }
    }

    // interval does not mean the "interval"-Property of the XoOrderExecutionTime but
    // what the XcFormAutocomplete is supposed to render in the GUI, which involves the value of this.intervalUnit
    private _readIntervalAndItsValuesFromObject() {
        if (this.executionTime && this.executionTime.timeWindow) {
            const tw = this.executionTime.timeWindow;
            this.executionType = ExecutionTypes.TIME_WINDOW;

            if (tw instanceof XoRestrictionBasedTimeWindow && tw.restriction.data.length) {
                const restrValue = tw.restriction.data[0].value;
                const restrUnit = tw.restriction.data[0].unit;

                // if restriction list's' length equals 1 then interval depends on the "unit" of this restriction
                if (tw.restriction.length === 1) {
                    if (restrUnit !== 'DayOfWeek') {
                        switch (restrUnit) {
                            case 'Millis':
                                this.intervalUnit = ExecutionTimeInterval.MILLISECONDS;
                                break;
                            case 'Second':
                                this.intervalUnit = ExecutionTimeInterval.SECONDS;
                                break;
                            case 'Minute':
                                this.intervalUnit = ExecutionTimeInterval.MINUTES;
                                break;
                            case 'Hour':
                                this.intervalUnit = ExecutionTimeInterval.HOURS;
                                break;
                            case 'Day':
                                this.intervalUnit = ExecutionTimeInterval.DAYS;
                                break;
                        }
                        // here we can also set the interval value
                        this.intervalValue = this._decodeIntervalValue(restrValue);
                    } else {
                        // unit is here: 'DayOfWeek'
                        this.intervalUnit = ExecutionTimeInterval.WEEK;

                        const dayArr = restrValue.split(',');
                        dayArr.forEach(day => {
                            switch (day) {
                                case 'MON':
                                    this.weekdayCheckboxValues[ExecutionTimeWeekday.MONDAY] = true;
                                    break;
                                case 'TUE':
                                    this.weekdayCheckboxValues[ExecutionTimeWeekday.TUESDAY] = true;
                                    break;
                                case 'WED':
                                    this.weekdayCheckboxValues[ExecutionTimeWeekday.WEDNESDAY] = true;
                                    break;
                                case 'THU':
                                    this.weekdayCheckboxValues[ExecutionTimeWeekday.THURSDAY] = true;
                                    break;
                                case 'FRI':
                                    this.weekdayCheckboxValues[ExecutionTimeWeekday.FRIDAY] = true;
                                    break;
                                case 'SAT':
                                    this.weekdayCheckboxValues[ExecutionTimeWeekday.SATURDAY] = true;
                                    break;
                                case 'SUN':
                                    this.weekdayCheckboxValues[ExecutionTimeWeekday.SUNDAY] = true;
                                    break;
                            }
                        });
                    }
                }

                // if restriction list's' length equals 2 then interval is "Monthly"
                // Interval Monthly is devided in "By Day of Month" and "By Weekday"
                if (tw.restriction.length === 2) {
                    this.intervalUnit = ExecutionTimeInterval.MONTH;
                    this.intervalValue = this._decodeIntervalValue(tw.restriction.data[1].value);

                    const restr0value = tw.restriction.data[0].value;

                    const isByWeekday = restr0value ? restr0value.indexOf('#') >= 0 : null;

                    // 0. restiction.unit === Day and 1. restiction.unit === Month and 0.restiction.value does NOT contain '#'
                    // then Interval Monthly "By Day of Month"
                    if (!isByWeekday) {
                        this.monthlyBySwitchValue = ExecutionTimeMonthlyBy.DAY_OF_MONTH;
                        this.atWhichDayValue = tw.restriction.data[0].value;

                        this.atWhichDaySwitchValue = ExecutionTimeMonthlyAtWhichDayOfTheMonth.OTHER;
                        if (this.atWhichDayValue === '1') {
                            this.atWhichDaySwitchValue = ExecutionTimeMonthlyAtWhichDayOfTheMonth.FIRST;
                        }

                        if (this.atWhichDayValue === '1L') {
                            this.atWhichDaySwitchValue = ExecutionTimeMonthlyAtWhichDayOfTheMonth.LAST;
                        }
                        this.atWhichDayOfTheMonthDataWrapper.update();
                    }

                    // 0. restiction.unit === Day and 1. restiction.unit === Month and 0.restiction.value DOES contain '#'
                    // then Interval Monthly "By Weekday"

                    if (isByWeekday) {
                        this.monthlyBySwitchValue = ExecutionTimeMonthlyBy.WEEKDAY;

                        // example for restr0unit: 4#3 => 4.th Wednesday (3rd day of the week) of month
                        const info = /([\d]*[L]?)#([\d]*)/.exec(restr0value);
                        if (info.length === 3) {
                            // [info[0]] => whole expression, info[1] => number left of #, info[2] => nr. right

                            switch (info[1]) {
                                case '1':
                                    this.monthlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.FIRST;
                                    break;
                                case '2':
                                    this.monthlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.SECOND;
                                    break;
                                case '3':
                                    this.monthlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.THIRD;
                                    break;
                                case '4':
                                    this.monthlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.FOURTH;
                                    break;
                                case '1L':
                                    this.monthlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.LAST;
                                    break;
                            }
                            this.monthlyByWeekdayPositionDataWrapper.update();

                            switch (info[2]) {
                                case '1':
                                    this.monthlyByWeekdayWeekdayValue = ExecutionTimeWeekday.MONDAY;
                                    break;
                                case '2':
                                    this.monthlyByWeekdayWeekdayValue = ExecutionTimeWeekday.TUESDAY;
                                    break;
                                case '3':
                                    this.monthlyByWeekdayWeekdayValue = ExecutionTimeWeekday.WEDNESDAY;
                                    break;
                                case '4':
                                    this.monthlyByWeekdayWeekdayValue = ExecutionTimeWeekday.THURSDAY;
                                    break;
                                case '5':
                                    this.monthlyByWeekdayWeekdayValue = ExecutionTimeWeekday.FRIDAY;
                                    break;
                                case '6':
                                    this.monthlyByWeekdayWeekdayValue = ExecutionTimeWeekday.SATURDAY;
                                    break;
                                case '7':
                                    this.monthlyByWeekdayWeekdayValue = ExecutionTimeWeekday.SUNDAY;
                                    break;
                            }
                            this.monthlyByDataWrapper.update();
                            this.monthlyByWeekdayWeekdayDataWrapper.update();
                        }
                    }

                    this.monthlyByDataWrapper.update();
                }

                // if restriction list's' length equals 3 then interval is "Yearly"
                // Interval Yearly is devided in "By Date" and "By Weekday"
                if (tw.restriction.length === 3) {
                    this.intervalUnit = ExecutionTimeInterval.YEAR;
                    this.intervalValue = this._decodeIntervalValue(tw.restriction.data[2].value);

                    const restr0value = tw.restriction.data[0].value; // Date: which Day 1-31, weekday: which position # which weekday
                    const restr1value = tw.restriction.data[1].value; // which Month 1-12

                    const isByWeekday = restr0value ? restr0value.indexOf('#') >= 0 : null;

                    // By Date
                    if (!isByWeekday) {
                        this.yearlyBySwitchValue = ExecutionTimeYearlyBy.DATE;
                        this.yearlyByDateDayValue = restr0value;
                        switch (restr1value) {
                            case '1':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.JANUARY;
                                break;
                            case '2':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.FEBRUARY;
                                break;
                            case '3':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.MARCH;
                                break;
                            case '4':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.APRIL;
                                break;
                            case '5':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.MAY;
                                break;
                            case '6':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.JUNE;
                                break;
                            case '7':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.JULY;
                                break;
                            case '8':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.AUGUST;
                                break;
                            case '9':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.SEPTEMBER;
                                break;
                            case '10':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.OCTOBER;
                                break;
                            case '11':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.NOVEMBER;
                                break;
                            case '12':
                                this.yearlyByDateMonthValue = ExecutionTimeMonth.DECEMBER;
                                break;
                        }
                        this.yearlyByDataWrapper.update();
                        this.yearlyByDateMonthDataWrapper.update();
                    }

                    // By Weekday
                    if (isByWeekday) {
                        this.yearlyBySwitchValue = ExecutionTimeYearlyBy.WEEKDAY;

                        // example for restr0unit: 4#3 => 4.th Wednesday (3rd day of the week) of month
                        const info = /([\d]*[L]?)#([\d]*)/.exec(restr0value);

                        if (info.length === 3) {
                            // [info[0]] => whole expression, info[1] => number left of #, info[2] => nr. right

                            switch (info[1]) {
                                case '1':
                                    this.yearlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.FIRST;
                                    break;
                                case '2':
                                    this.yearlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.SECOND;
                                    break;
                                case '3':
                                    this.yearlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.THIRD;
                                    break;
                                case '4':
                                    this.yearlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.FOURTH;
                                    break;
                                case '1L':
                                    this.yearlyByWeekdayPositionValue = ExecutionTimeWeekdayPositionInMonth.LAST;
                                    break;
                            }
                            this.yearlyByWeekdayPositionDataWrapper.update();

                            switch (info[2]) {
                                case '1':
                                    this.yearlyByWeekdayWeekdayValue = ExecutionTimeWeekday.MONDAY;
                                    break;
                                case '2':
                                    this.yearlyByWeekdayWeekdayValue = ExecutionTimeWeekday.TUESDAY;
                                    break;
                                case '3':
                                    this.yearlyByWeekdayWeekdayValue = ExecutionTimeWeekday.WEDNESDAY;
                                    break;
                                case '4':
                                    this.yearlyByWeekdayWeekdayValue = ExecutionTimeWeekday.THURSDAY;
                                    break;
                                case '5':
                                    this.yearlyByWeekdayWeekdayValue = ExecutionTimeWeekday.FRIDAY;
                                    break;
                                case '6':
                                    this.yearlyByWeekdayWeekdayValue = ExecutionTimeWeekday.SATURDAY;
                                    break;
                                case '7':
                                    this.yearlyByWeekdayWeekdayValue = ExecutionTimeWeekday.SUNDAY;
                                    break;
                            }
                            this.yearlyByWeekdayWeekdayDataWrapper.update();

                            switch (restr1value) {
                                case '1':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.JANUARY;
                                    break;
                                case '2':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.FEBRUARY;
                                    break;
                                case '3':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.MARCH;
                                    break;
                                case '4':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.APRIL;
                                    break;
                                case '5':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.MAY;
                                    break;
                                case '6':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.JUNE;
                                    break;
                                case '7':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.JULY;
                                    break;
                                case '8':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.AUGUST;
                                    break;
                                case '9':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.SEPTEMBER;
                                    break;
                                case '10':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.OCTOBER;
                                    break;
                                case '11':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.NOVEMBER;
                                    break;
                                case '12':
                                    this.yearlyByWeekdayMonthValue = ExecutionTimeMonth.DECEMBER;
                                    break;
                            }
                            this.yearlyByWeekdayMonthDataWrapper.update();
                        }
                    }
                }
            } else {
                this.executionTime.timeWindow = new XoRestrictionBasedTimeWindow();
            }
        }
        this.yearlyByDataWrapper.update();
        this.intervalDataWrapper.update();
        this.executionTypeDataWrapper.update();
    }

    private _writeIntervalAndItsValuesToObject() {
        // If the execution type is set to always there is no time window
        if (this.hasTimeWindow && this.executionType === ExecutionTypes.ALWAYS) {
            this.executionTime.timeWindow = null;
        } else {
            const tw = this.executionTime.timeWindow;

            if (tw instanceof XoRestrictionBasedTimeWindow) {
                tw.duration = new XoTimeUnitArray();
                tw.duration.data.push(new XoTimeUnit());
                tw.duration.data[0].unit = 'Millis';
                tw.duration.data[0].value = this.windowLength.toString();

                tw.restriction = new XoTimeUnitArray();

                //#region - FOR INTERVAL = MILLISECONDS, SECONDS, MINUTES, HOURS, DAYS
                const easyIntervalOptions = [ExecutionTimeInterval.MILLISECONDS, ExecutionTimeInterval.SECONDS, ExecutionTimeInterval.MINUTES, ExecutionTimeInterval.HOURS, ExecutionTimeInterval.DAYS];

                if (easyIntervalOptions.indexOf(<ExecutionTimeInterval>(this).intervalUnit) >= 0) {
                    const firstRestriction = new XoTimeUnit();
                    firstRestriction.value = this._encodeIntervalValue(this.intervalValue);
                    switch (this.intervalUnit) {
                        case ExecutionTimeInterval.MILLISECONDS:
                            firstRestriction.unit = 'Millis';
                            break;
                        case ExecutionTimeInterval.SECONDS:
                            firstRestriction.unit = 'Second';
                            break;
                        case ExecutionTimeInterval.MINUTES:
                            firstRestriction.unit = 'Minute';
                            break;
                        case ExecutionTimeInterval.HOURS:
                            firstRestriction.unit = 'Hour';
                            break;
                        case ExecutionTimeInterval.DAYS:
                            firstRestriction.unit = 'Day';
                            break;
                    }
                    tw.restriction.data.push(firstRestriction);
                }
                //#endregion

                //#region - FOR INTERVAL = WEEK
                if (<ExecutionTimeInterval>(this).intervalUnit === ExecutionTimeInterval.WEEK) {
                    const firstRestriction = new XoTimeUnit();
                    firstRestriction.unit = 'DayOfWeek';

                    const checkedWeekdays: string[] = [];

                    this.weekdaysArray.forEach(day => {
                        if (this.weekdayCheckboxValues[day]) {
                            switch (day) {
                                case ExecutionTimeWeekday.MONDAY:
                                    checkedWeekdays.push('MON');
                                    break;
                                case ExecutionTimeWeekday.TUESDAY:
                                    checkedWeekdays.push('TUE');
                                    break;
                                case ExecutionTimeWeekday.WEDNESDAY:
                                    checkedWeekdays.push('WED');
                                    break;
                                case ExecutionTimeWeekday.THURSDAY:
                                    checkedWeekdays.push('THU');
                                    break;
                                case ExecutionTimeWeekday.FRIDAY:
                                    checkedWeekdays.push('FRI');
                                    break;
                                case ExecutionTimeWeekday.SATURDAY:
                                    checkedWeekdays.push('SAT');
                                    break;
                                case ExecutionTimeWeekday.SUNDAY:
                                    checkedWeekdays.push('SUN');
                                    break;
                            }
                        }
                    });

                    if (checkedWeekdays.length) {
                        firstRestriction.value = checkedWeekdays.join(',');
                        tw.restriction.data.push(firstRestriction);
                    }
                }
                //#endregion

                //#region - FOR INTERVAL = MONTH
                if (<ExecutionTimeInterval>(this).intervalUnit === ExecutionTimeInterval.MONTH) {
                    const firstRestriction = new XoTimeUnit();
                    firstRestriction.unit = 'Day';
                    const secondRestriction = new XoTimeUnit();
                    secondRestriction.unit = 'Month';
                    secondRestriction.value = this._encodeIntervalValue(this.intervalValue);

                    //#region - INTERVAL = MONTHLY - DAY OF MONTH
                    if (this.monthlyBySwitchValue === ExecutionTimeMonthlyBy.DAY_OF_MONTH) {
                        switch (this.atWhichDaySwitchValue) {
                            case ExecutionTimeMonthlyAtWhichDayOfTheMonth.FIRST:
                                firstRestriction.value = '1';
                                break;
                            case ExecutionTimeMonthlyAtWhichDayOfTheMonth.LAST:
                                firstRestriction.value = '1L';
                                break;
                            case ExecutionTimeMonthlyAtWhichDayOfTheMonth.OTHER:
                                firstRestriction.value = this.atWhichDayValue;
                                break;
                        }
                    }
                    //#endregion

                    //#region - INTERVAL = MONTHLY - WEEKDAY
                    if (this.monthlyBySwitchValue === ExecutionTimeMonthlyBy.WEEKDAY) {
                        let info1: string, info2: string;

                        switch (this.monthlyByWeekdayPositionValue) {
                            case ExecutionTimeWeekdayPositionInMonth.FIRST:
                                info1 = '1';
                                break;
                            case ExecutionTimeWeekdayPositionInMonth.SECOND:
                                info1 = '2';
                                break;
                            case ExecutionTimeWeekdayPositionInMonth.THIRD:
                                info1 = '3';
                                break;
                            case ExecutionTimeWeekdayPositionInMonth.FOURTH:
                                info1 = '4';
                                break;
                            case ExecutionTimeWeekdayPositionInMonth.LAST:
                                info1 = '1L';
                                break;
                        }

                        switch (this.monthlyByWeekdayWeekdayValue) {
                            case ExecutionTimeWeekday.MONDAY:
                                info2 = '1';
                                break;
                            case ExecutionTimeWeekday.TUESDAY:
                                info2 = '2';
                                break;
                            case ExecutionTimeWeekday.WEDNESDAY:
                                info2 = '3';
                                break;
                            case ExecutionTimeWeekday.THURSDAY:
                                info2 = '4';
                                break;
                            case ExecutionTimeWeekday.FRIDAY:
                                info2 = '5';
                                break;
                            case ExecutionTimeWeekday.SATURDAY:
                                info2 = '6';
                                break;
                            case ExecutionTimeWeekday.SUNDAY:
                                info2 = '7';
                                break;
                        }

                        firstRestriction.value = info1 + '#' + info2;
                    }
                    //#endregion

                    tw.restriction.data.push(firstRestriction, secondRestriction);
                }
                //#endregion

                //#region - FOR INTERVAL = YEAR
                if (<ExecutionTimeInterval>(this).intervalUnit === ExecutionTimeInterval.YEAR) {
                    const firstRestriction = new XoTimeUnit();
                    firstRestriction.unit = 'Day';
                    const secondRestriction = new XoTimeUnit();
                    secondRestriction.unit = 'Month';
                    const thirdRestriction = new XoTimeUnit();
                    thirdRestriction.unit = 'Year';
                    thirdRestriction.value = this._encodeIntervalValue(this.intervalValue);

                    const getNumberOfMonth = (input: string) => {
                        switch (input) {
                            case ExecutionTimeMonth.JANUARY:
                                return '1';
                            case ExecutionTimeMonth.FEBRUARY:
                                return '2';
                            case ExecutionTimeMonth.MARCH:
                                return '3';
                            case ExecutionTimeMonth.APRIL:
                                return '4';
                            case ExecutionTimeMonth.MAY:
                                return '5';
                            case ExecutionTimeMonth.JUNE:
                                return '6';
                            case ExecutionTimeMonth.JULY:
                                return '7';
                            case ExecutionTimeMonth.AUGUST:
                                return '8';
                            case ExecutionTimeMonth.SEPTEMBER:
                                return '9';
                            case ExecutionTimeMonth.OCTOBER:
                                return '10';
                            case ExecutionTimeMonth.NOVEMBER:
                                return '11';
                            case ExecutionTimeMonth.DECEMBER:
                                return '12';
                        }
                    };

                    //#region - INTERVAL = YEAR - DATE
                    if (this.yearlyBySwitchValue === ExecutionTimeYearlyBy.DATE) {
                        firstRestriction.value = this.yearlyByDateDayValue;
                        secondRestriction.value = getNumberOfMonth(this.yearlyByDateMonthValue);
                    }
                    //#endregion

                    //#region - INTERVAL = YEAR - WEEKDAY
                    if (this.yearlyBySwitchValue === ExecutionTimeYearlyBy.WEEKDAY) {
                        let info1: string, info2: string;

                        secondRestriction.value = getNumberOfMonth(this.yearlyByWeekdayMonthValue);

                        switch (this.yearlyByWeekdayPositionValue) {
                            case ExecutionTimeWeekdayPositionInMonth.FIRST:
                                info1 = '1';
                                break;
                            case ExecutionTimeWeekdayPositionInMonth.SECOND:
                                info1 = '2';
                                break;
                            case ExecutionTimeWeekdayPositionInMonth.THIRD:
                                info1 = '3';
                                break;
                            case ExecutionTimeWeekdayPositionInMonth.FOURTH:
                                info1 = '4';
                                break;
                            case ExecutionTimeWeekdayPositionInMonth.LAST:
                                info1 = '1L';
                                break;
                        }

                        switch (this.yearlyByWeekdayWeekdayValue) {
                            case ExecutionTimeWeekday.MONDAY:
                                info2 = '1';
                                break;
                            case ExecutionTimeWeekday.TUESDAY:
                                info2 = '2';
                                break;
                            case ExecutionTimeWeekday.WEDNESDAY:
                                info2 = '3';
                                break;
                            case ExecutionTimeWeekday.THURSDAY:
                                info2 = '4';
                                break;
                            case ExecutionTimeWeekday.FRIDAY:
                                info2 = '5';
                                break;
                            case ExecutionTimeWeekday.SATURDAY:
                                info2 = '6';
                                break;
                            case ExecutionTimeWeekday.SUNDAY:
                                info2 = '7';
                                break;
                        }

                        firstRestriction.value = info1 + '#' + info2;
                    }
                    //#endregion

                    tw.restriction.data.push(firstRestriction, secondRestriction, thirdRestriction);
                }
                //#endregion
            } else {
                this.executionTime.timeWindow = new XoRestrictionBasedTimeWindow();
            }
        }
    }

    validityChange(formDir: XcFormDirective) {
        this.invalidChange.emit(formDir.invalid);
    }

    validityChangeBoolean(value: boolean) {
        this.invalidChange.emit(value);
    }

    // used in reading
    private _decodeIntervalValue(val: string): string {
        return val ? val.replace(':', '') : '';
    }

    // used in writing
    private _encodeIntervalValue(val: string): string {
        return val ? ':' + val : '';
    }
}
