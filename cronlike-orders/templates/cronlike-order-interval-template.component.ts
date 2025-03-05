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
import { Component, InjectionToken, Injector } from '@angular/core';

import { XoOrderExecutionTime } from '@fman/xo/xo-orderexecutiontime.model';
import { XoRestrictionBasedTimeWindow } from '@fman/xo/xo-timewindow.model';
import { I18nParam, I18nService } from '@zeta/i18n';
import { XC_COMPONENT_DATA, XcDynamicComponent } from '@zeta/xc';


interface IntervalData {
    message: string;
    values: I18nParam[];
}

export interface CronlikeOrderIntervalTemplateData {
    executionTime: XoOrderExecutionTime;
}

@Component({
    template: '<span>{{interval}}</span>',
    styleUrls: ['./cronlike-order-interval-template.component.scss'],
    standalone: false
})
export class CronlikeOrderIntervalTemplateComponent extends XcDynamicComponent<CronlikeOrderIntervalTemplateData> {

    interval: string;

    get executionTime(): XoOrderExecutionTime {
        return this.injectedData.executionTime;
    }

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }

    constructor(readonly injector: Injector, readonly i18n: I18nService) {
        super(injector);

        const intervalObject = this._readIntervalAndItsValuesFromObject();
        this.interval = this.i18n.translate(intervalObject.message, ...intervalObject.values);
    }

    private _readIntervalAndItsValuesFromObject(): IntervalData {
        if (this.executionTime && this.executionTime.timeWindow) {
            const tw = this.executionTime.timeWindow;

            if (tw instanceof XoRestrictionBasedTimeWindow && tw.restriction.data.length) {
                const interval: IntervalData = {
                    message: 'Every',
                    values: []
                };
                // if restriction list's' length equals 1 then interval depends on the "unit" of this restriction
                if (tw.restriction.length === 1) {
                    const restr0value = tw.restriction.data[0].value.substr(1, tw.restriction.data[0].value.length);
                    const restr0Unit = tw.restriction.data[0].unit;

                    if (restr0Unit !== 'DayOfWeek') {
                        interval.values.push({ key: '%value0%', value: restr0value });

                        switch (restr0Unit) {
                            case 'Millis':
                                interval.message += 'milliseconds';
                                break;
                            case 'Second':
                                interval.message += 'seconds';
                                break;
                            case 'Minute':
                                interval.message += 'minutes';
                                break;
                            case 'Hour':
                                interval.message += 'hours';
                                break;
                            case 'Day':
                                interval.message += 'days';
                                break;
                        }
                    } else {
                        interval.message += 'weekon';

                        const days = [];

                        const dayArr = restr0value.split(',');
                        for (const day of dayArr) {
                            switch (day) {
                                case 'MON':
                                    days.push(this.i18n.translate('monday'));
                                    break;
                                case 'TUE':
                                    days.push(this.i18n.translate('tuesday'));
                                    break;
                                case 'WED':
                                    days.push(this.i18n.translate('wednesday'));
                                    break;
                                case 'THU':
                                    days.push(this.i18n.translate('thursday'));
                                    break;
                                case 'FRI':
                                    days.push(this.i18n.translate('friday'));
                                    break;
                                case 'SAT':
                                    days.push(this.i18n.translate('saturday'));
                                    break;
                                case 'SUN':
                                    days.push(this.i18n.translate('sunday'));
                                    break;
                            }
                        }
                        interval.values.push({ key: '%value0%', value: days.join(', ') });
                    }
                }

                // if restriction list's' length equals 2 then interval is "Monthly"
                // Interval Monthly is devided in "By Day of Month" and "By Weekday"
                if (tw.restriction.length === 2) {
                    const restr0value = tw.restriction.data[0].value;
                    const restr1value = tw.restriction.data[1].value.substr(1, tw.restriction.data[1].value.length);
                    interval.values.push({ key: '%value0%', value: restr1value });
                    interval.values.push({ key: '%value1%', value: restr0value });
                    const isByWeekday = restr0value ? restr0value.indexOf('#') >= 0 : null;

                    // then Interval Monthly "By Day of Month"
                    if (!isByWeekday) {
                        if (restr0value === '1') {
                            interval.message += 'monthsonfirstdayofthemonth';
                        } else if (restr0value === '1L') {
                            interval.message += 'monthsonlastdayofthemonth';
                        } else {
                            interval.message += 'monthsatdayofthemonth';
                        }
                    }

                    if (isByWeekday) {
                        interval.message += 'monthsonday';
                        const info = /([\d]*[L]?)#([\d]*)/.exec(restr0value);

                        switch (info[1]) {
                            case '1':
                                interval.values.push({ key: '%value2%', value: this.i18n.translate('first') });
                                break;
                            case '2':
                                interval.values.push({ key: '%value2%', value: this.i18n.translate('second') });
                                break;
                            case '3':
                                interval.values.push({ key: '%value2%', value: this.i18n.translate('third') });
                                break;
                            case '4':
                                interval.values.push({ key: '%value2%', value: this.i18n.translate('fourth') });
                                break;
                            case '1L':
                                interval.values.push({ key: '%value2%', value: this.i18n.translate('last') });
                                break;
                        }

                        switch (info[2]) {
                            case '1':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('monday') });
                                break;
                            case '2':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('tuesday') });
                                break;
                            case '3':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('wednesday') });
                                break;
                            case '4':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('thursday') });
                                break;
                            case '5':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('friday') });
                                break;
                            case '6':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('saturday') });
                                break;
                            case '7':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('sunday') });
                                break;
                        }
                    }
                }

                // if restriction list's' length equals 3 then interval is "Yearly"
                // Interval Yearly is devided in "By Date" and "By Weekday"
                if (tw.restriction.length === 3) {

                    const restr0value = tw.restriction.data[0].value; // Date: which Day 1-31, weekday: which position # which weekday
                    const restr1value = tw.restriction.data[1].value; // which Month 1-12
                    const restr2value = tw.restriction.data[2].value.substr(1, tw.restriction.data[2].value.length);
                    interval.values.push({ key: '%value0%', value: restr2value });
                    interval.values.push({ key: '%value1%', value: restr0value });
                    interval.values.push({ key: '%value2%', value: restr1value });
                    const isByWeekday = restr0value ? restr0value.indexOf('#') >= 0 : null;

                    // By Date
                    if (!isByWeekday) {
                        interval.message += 'yearsonrd';

                        switch (restr1value) {
                            case '1':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('January') });
                                break;
                            case '2':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('February') });
                                break;
                            case '3':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('March') });
                                break;
                            case '4':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('April') });
                                break;
                            case '5':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('May') });
                                break;
                            case '6':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('June') });
                                break;
                            case '7':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('July') });
                                break;
                            case '8':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('August') });
                                break;
                            case '9':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('September') });
                                break;
                            case '10':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('October') });
                                break;
                            case '11':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('November') });
                                break;
                            case '12':
                                interval.values.push({ key: '%value3%', value: this.i18n.translate('December') });
                                break;
                        }
                    }

                    // By Weekday
                    if (isByWeekday) {

                        // example for restr0unit: 4#3 => 4.th Wednesday (3rd day of the week) of month
                        const info = /([\d]*[L]?)#([\d]*)/.exec(restr0value);
                        interval.message += 'yearsonof';

                        if (info.length === 3) {
                            // [info[0]] => whole expression, info[1] => number left of #, info[2] => nr. right

                            switch (info[1]) {
                                case '1':
                                    interval.values.push({ key: '%value3%', value: this.i18n.translate('first') });
                                    break;
                                case '2':
                                    interval.values.push({ key: '%value3%', value: this.i18n.translate('second') });
                                    break;
                                case '3':
                                    interval.values.push({ key: '%value3%', value: this.i18n.translate('third') });
                                    break;
                                case '4':
                                    interval.values.push({ key: '%value3%', value: this.i18n.translate('fourth') });
                                    break;
                                case '1L':
                                    interval.values.push({ key: '%value3%', value: this.i18n.translate('last') });
                                    break;
                            }

                            switch (info[2]) {
                                case '1':
                                    interval.values.push({ key: '%value4%', value: this.i18n.translate('monday') });
                                    break;
                                case '2':
                                    interval.values.push({ key: '%value4%', value: this.i18n.translate('tuesday') });
                                    break;
                                case '3':
                                    interval.values.push({ key: '%value4%', value: this.i18n.translate('wednesday') });
                                    break;
                                case '4':
                                    interval.values.push({ key: '%value4%', value: this.i18n.translate('thursday') });
                                    break;
                                case '5':
                                    interval.values.push({ key: '%value4%', value: this.i18n.translate('friday') });
                                    break;
                                case '6':
                                    interval.values.push({ key: '%value4%', value: this.i18n.translate('saturday') });
                                    break;
                                case '7':
                                    interval.values.push({ key: '%value4%', value: this.i18n.translate('sunday') });
                                    break;
                            }

                            switch (restr1value) {
                                case '1':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('Januar') });
                                    break;
                                case '2':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('Februar') });
                                    break;
                                case '3':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('March') });
                                    break;
                                case '4':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('April') });
                                    break;
                                case '5':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('May') });
                                    break;
                                case '6':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('June') });
                                    break;
                                case '7':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('July') });
                                    break;
                                case '8':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('August') });
                                    break;
                                case '9':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('September') });
                                    break;
                                case '10':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('October') });
                                    break;
                                case '11':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('November') });
                                    break;
                                case '12':
                                    interval.values.push({ key: '%value5%', value: this.i18n.translate('December') });
                                    break;
                            }
                        }
                    }
                }
                return interval;
            }
        }
    }
}
