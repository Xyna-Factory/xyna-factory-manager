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
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';

import { ApiService, RuntimeContext, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogService, XcFormDirective, XcOptionItem, XcStringIntegerDataWrapper } from '@zeta/xc';

import { Subscription } from 'rxjs';

import { XoTimezoneArray } from '../../../xo/xo-timezone.model';


@Component({
    selector: 'date-selector',
    templateUrl: './date-selector.component.html',
    styleUrls: ['./date-selector.component.scss'],
    standalone: false
})
export class DateSelectorComponent implements AfterViewInit, OnDestroy {

    private static readonly FM_WF_GET_TIMEZONES = 'xmcp.factorymanager.shared.GetTimezones';

    private _timezone: string;
    timezoneDataWrapper = new XcAutocompleteDataWrapper(
        () => this._timezone,
        value => {
            this._timezone = value;
            this.timezoneChanged.emit(this._timezone);
        }
    );

    @Input() header: string;
    @Input() disableTimeZoneSelection: boolean;

    @Input('timezone')
    set timezone(value: string) {
        this._timezone = value;
        this.timezoneDataWrapper.update();
    }

    @Output('timezoneChange')
    readonly timezoneChanged = new EventEmitter<string>();


    @ViewChild(XcFormDirective, {static: false})
    form: XcFormDirective;
    private validityChangeSubscription: Subscription;

    @Output('validityChange')
    readonly validityChangeEmitter = new EventEmitter<boolean>();



    private _datetime: number;

    @Input('datetime')
    set datetime(value: number) {
        if (value && value !== this._datetime) {
            // handle this date as UTC, internally
            const date = new Date(value);
            this._year = date.getFullYear();
            this._month = date.getUTCMonth() + 1;
            this._date = date.getUTCDate();

            this._hours = date.getUTCHours();
            this._minutes = date.getUTCMinutes();
            this._seconds = date.getUTCSeconds();
            this._milliseconds = date.getUTCMilliseconds();
        }
    }

    @Output('datetimeChange')
    readonly datetimeChanged = new EventEmitter<number>();


    @Input()
    set runtimeContext(value: RuntimeContext) {
        this.apiService.startOrder(value, DateSelectorComponent.FM_WF_GET_TIMEZONES, [], XoTimezoneArray, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).subscribe(result => {
            if (result && !result.errorMessage) {
                const zones = result.output[0] as XoTimezoneArray;
                if (zones && zones.length > 0) {
                    this.timezoneDataWrapper.values = zones.data.map(zone => <XcOptionItem>{ name: zone.label, value: zone.label });
                } else {
                    this.dialogService.error(this.i18n.translate('fman.date-selector.error-timezone'));
                }
            } else {
                this.dialogService.error(result.errorMessage);
            }
        });
    }


    //#region  - start time variables
    private _year: number;
    yearDataWrapper = new XcStringIntegerDataWrapper(
        () => this._year,
        (val: number) => {
            this._year = val;
            this.updateDatetime();
        }
    );

    private _month: number;
    monthDataWrapper = new XcStringIntegerDataWrapper(
        () => this._month,
        (val: number) => {
            this._month = val;
            this.updateDatetime();
        }
    );

    private _date: number;
    dateDataWrapper = new XcStringIntegerDataWrapper(
        () => this._date,
        (val: number) => {
            this._date = val;
            this.updateDatetime();
        }
    );
    // ##########################################################################

    private _hours: number;
    hoursDataWrapper = new XcStringIntegerDataWrapper(
        () => this._hours,
        (val: number) => {
            this._hours = val;
            this.updateDatetime();
        }
    );

    private _minutes: number;
    minutesDataWrapper = new XcStringIntegerDataWrapper(
        () => this._minutes,
        (val: number) => {
            this._minutes = val;
            this.updateDatetime();
        }
    );

    private _seconds: number;
    secondsDataWrapper = new XcStringIntegerDataWrapper(
        () => this._seconds,
        (val: number) => {
            this._seconds = val;
            this.updateDatetime();
        }
    );

    private _milliseconds: number;
    millisecondsDataWrapper = new XcStringIntegerDataWrapper(
        () => this._milliseconds,
        (val: number) => {
            this._milliseconds = val;
            this.updateDatetime();
        }
    );


    constructor(private readonly apiService: ApiService, private readonly i18n: I18nService, private readonly dialogService: XcDialogService) {
    }


    ngAfterViewInit() {
        this.validityChangeSubscription = this.form.validityChange.subscribe(formDirective => this.validityChangeEmitter.emit(formDirective.valid));
    }


    ngOnDestroy(): void {
        this.validityChangeSubscription.unsubscribe();
    }


    private updateDatetime() {
        // Used to schedule the event in the event loop after the changedetection
        setTimeout(() => {
            // handle this date as UTC, internally
            const date = new Date(0);
            date.setFullYear(this._year);
            date.setUTCMonth(this._month - 1, this._date);
            date.setUTCHours(this._hours, this._minutes, this._seconds, this._milliseconds);
            this._datetime = date.getTime();
            this.datetimeChanged.emit(this._datetime);
        }, 0);
    }
}
