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
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';

import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcFormDirective } from '@zeta/xc';

import { Subscription } from 'rxjs';

import { ExecutionTimeBehaviorOnError } from '../../../cronlike-orders/components/execution-time/execution-time.constant';
import { XoTCOExecutionRestriction } from '../../xo/xo-tcoexecution-restriction.model';


export enum TimeRestrictionOptions {
    milliseconds = 'Milliseconds',
    seconds = 'Seconds',
    minutes = 'Minutes',
    hours = 'Hours',
    days = 'Days'
}

/** Factors to get milliseconds out of a TimeRestrictionOption*/
export const TimeConversion = {
    [TimeRestrictionOptions.milliseconds]: 1,
    [TimeRestrictionOptions.seconds]: 1000,
    [TimeRestrictionOptions.minutes]: 60000,
    [TimeRestrictionOptions.hours]: 3600000,
    [TimeRestrictionOptions.days]: 86400000
};

@Component({
    selector: 'tco-execution-restriction',
    templateUrl: './tco-execution-restriction.component.html',
    styleUrls: ['./tco-execution-restriction.component.scss'],
    standalone: false
})
export class TcoExecutionRestrictionComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(XcFormDirective, { static: false })
    xcFormDirective: XcFormDirective;

    behaviorOnErrorDataWrapper: XcAutocompleteDataWrapper;
    selectedBehaviorOnError: ExecutionTimeBehaviorOnError;

    executionIntervalUnitDataWrapper: XcAutocompleteDataWrapper<TimeRestrictionOptions>;
    schedulingTimeoutUnitDataWrapper: XcAutocompleteDataWrapper<TimeRestrictionOptions>;
    executionTimeoutUnitDataWrapper: XcAutocompleteDataWrapper<TimeRestrictionOptions>;

    executionIntervalUnit: TimeRestrictionOptions = TimeRestrictionOptions.milliseconds;
    schedulingTimeoutUnit: TimeRestrictionOptions = TimeRestrictionOptions.milliseconds;
    executionTimeoutUnit: TimeRestrictionOptions = TimeRestrictionOptions.milliseconds;

    private _executionInterval: number;
    private _schedulingTimeout: number;
    private _executionTimeout: number;
    private validityChangeSubscription: Subscription;
    private _executionRestriction: XoTCOExecutionRestriction;

    @Output()
    private readonly validationChange = new EventEmitter<boolean>();
    @Output()
    private readonly executionRestrictionChange = new EventEmitter<XoTCOExecutionRestriction>();

    @Input()
    private readonly hasTooltip: boolean;

    @Input()
    get executionRestriction(): XoTCOExecutionRestriction {
        return this._executionRestriction;
    }

    set executionRestriction(value: XoTCOExecutionRestriction) {
        this._executionRestriction = value;
        this.executionRestrictionChange.emit(value);
    }

    get timeoutTooltip(): string {
        return this.hasTooltip ? this.i18n.translate('fman.tco.detail-section.tco-execution-restriction.tooltip-timeout') : null;
    }

    set executionInterval(value: number) {
        this._executionInterval = value;
        this.executionRestriction.executionInterval = this.toMilliSeconds(value, this.executionIntervalUnit);
        this.executionRestrictionChange.emit(this.executionRestriction);
    }
    get executionInterval(): number {
        return this._executionInterval;
    }

    set schedulingTimeout(value: number) {
        this._schedulingTimeout = value;
        this.executionRestriction.schedulingTimeout = this.toMilliSeconds(value, this.schedulingTimeoutUnit);
        this.executionRestrictionChange.emit(this.executionRestriction);
    }
    get schedulingTimeout(): number {
        return this._schedulingTimeout;
    }

    set executionTimeout(value: number) {
        this._executionTimeout = value;
        this.executionRestriction.executionTimeout = this.toMilliSeconds(value, this.executionTimeoutUnit);
        this.executionRestrictionChange.emit(this.executionRestriction);
    }
    get executionTimeout(): number {
        return this._executionTimeout;
    }

    set treatTimeoutsAsError(value: boolean) {
        this.executionRestriction.treatTimeoutsAsError = value;
        this.executionRestrictionChange.emit(this.executionRestriction);
    }
    get treatTimeoutsAsError(): boolean {
        return this.executionRestriction.treatTimeoutsAsError;
    }

    get maximumExcecutions(): number {
        return this.executionRestriction ? this.executionRestriction.maximumExcecutions : 1;
    }

    set maximumExcecutions(value: number) {
        this.executionRestriction.maximumExcecutions = value;
        this.executionRestrictionChange.emit(this.executionRestriction);
    }

    constructor(private readonly i18n: I18nService) {
        this.behaviorOnErrorDataWrapper = new XcAutocompleteDataWrapper(
            () => this.selectedBehaviorOnError,
            (value: ExecutionTimeBehaviorOnError) => {
                this.selectedBehaviorOnError = value;
                this.executionRestriction.behaviorOnError = value;
                this.executionRestrictionChange.emit(this.executionRestriction);
            },
            Object.keys(ExecutionTimeBehaviorOnError).map(key => ({
                name: this.i18n.translate(ExecutionTimeBehaviorOnError[key]),
                value: ExecutionTimeBehaviorOnError[key]
            }))
        );

        this.executionIntervalUnitDataWrapper = new XcAutocompleteDataWrapper(
            () => this.executionIntervalUnit,
            (value: TimeRestrictionOptions) => {
                this.executionIntervalUnit = value;
                this.executionRestriction.executionInterval = this.toMilliSeconds(this.executionInterval, value);
                this.executionRestrictionChange.emit(this.executionRestriction);
            },
            Object.keys(TimeRestrictionOptions).map(key => ({ name: this.i18n.translate(TimeRestrictionOptions[key]), value: TimeRestrictionOptions[key] }))
        );

        this.schedulingTimeoutUnitDataWrapper = new XcAutocompleteDataWrapper(
            () => this.schedulingTimeoutUnit,
            (value: TimeRestrictionOptions) => {
                this.schedulingTimeoutUnit = value;
                this.executionRestriction.schedulingTimeout = this.toMilliSeconds(this.schedulingTimeout, value);
                this.executionRestrictionChange.emit(this.executionRestriction);
            },
            Object.keys(TimeRestrictionOptions).map(key => ({ name: this.i18n.translate(TimeRestrictionOptions[key]), value: TimeRestrictionOptions[key] }))
        );

        this.executionTimeoutUnitDataWrapper = new XcAutocompleteDataWrapper(
            () => this.executionTimeoutUnit,
            (value: TimeRestrictionOptions) => {
                this.executionTimeoutUnit = value;
                this.executionRestriction.executionTimeout = this.toMilliSeconds(this.executionTimeout, value);
                this.executionRestrictionChange.emit(this.executionRestriction);
            },
            Object.keys(TimeRestrictionOptions).map(key => ({ name: this.i18n.translate(TimeRestrictionOptions[key]), value: TimeRestrictionOptions[key] }))
        );
    }

    ngOnInit() {
        if (this.executionRestriction) {
            this._executionInterval = this.executionRestriction.executionInterval;
            this._schedulingTimeout = this.executionRestriction.schedulingTimeout;
            this._executionTimeout = this.executionRestriction.executionTimeout;

            this.maximumExcecutions = this.executionRestriction.maximumExcecutions || 1;
            this.treatTimeoutsAsError = this.executionRestriction.treatTimeoutsAsError || false;

            this.executionRestriction.behaviorOnError = this.executionRestriction.behaviorOnError || ExecutionTimeBehaviorOnError.IGNORE;
            this.selectedBehaviorOnError = this.executionRestriction.behaviorOnError as ExecutionTimeBehaviorOnError;

            // Setting up units because they come in miliseconds from the back-end
            Object.values(TimeRestrictionOptions).forEach(unit => {
                if (this.executionRestriction.executionInterval % TimeConversion[unit] === 0) {
                    this.executionIntervalUnit = unit;
                    this.executionInterval = this.executionRestriction.executionInterval / TimeConversion[unit];
                }

                if (this.executionRestriction.schedulingTimeout % TimeConversion[unit] === 0) {
                    this.schedulingTimeoutUnit = unit;
                    this.schedulingTimeout = this.executionRestriction.schedulingTimeout / TimeConversion[unit];
                }

                if (this.executionRestriction.executionTimeout % TimeConversion[unit] === 0) {
                    this.executionTimeoutUnit = unit;
                    this.executionTimeout = this.executionRestriction.executionTimeout / TimeConversion[unit];
                }
            });

            this.behaviorOnErrorDataWrapper.update();
            this.executionIntervalUnitDataWrapper.update();
            this.schedulingTimeoutUnitDataWrapper.update();
            this.executionTimeoutUnitDataWrapper.update();
        }
    }

    ngAfterViewInit() {
        // Setting up an observable to detect validity change in parent
        this.validityChangeSubscription = this.xcFormDirective.validityChange.subscribe(form => {
            this.validationChange.emit(form.valid);
        });
        // Because validityChange is not a behavior subject
        this.validationChange.emit(this.xcFormDirective.valid);
    }

    ngOnDestroy() {
        this.validityChangeSubscription.unsubscribe();
    }

    toMilliSeconds(value, unit: TimeRestrictionOptions) {
        return value ? value * TimeConversion[unit] : null;
    }
}
