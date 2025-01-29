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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, InjectionToken, Injector } from '@angular/core';
import { FM_RTC } from '@fman/const';
import { ORDER_TYPES } from '@fman/trigger-and-filter/order-types';
import { XoFilterInstanceDetails } from '@fman/trigger-and-filter/xo/xo-filter-instance-details.model';
import { XoFilterInstance } from '@fman/trigger-and-filter/xo/xo-filter-instance.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';

import { I18nService } from '@zeta/i18n';
import { XC_COMPONENT_DATA, XDSIconName, XcDialogService, XcDynamicComponent } from '@zeta/xc';
import { filter } from 'rxjs';


export interface FilterInstanceDetailsData{
    filterinstance: XoFilterInstance;
    refresh: () => void;
}

@Component({
    templateUrl: './filter-instance-detail.component.html',
    styleUrls: ['./filter-instance-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class FilterInstanceDetailComponent extends XcDynamicComponent<FilterInstanceDetailsData> {

    readonly XDSIconName = XDSIconName;

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }

    detail: XoFilterInstanceDetails = new XoFilterInstanceDetails();
    busy = false;

    constructor(injector: Injector,
        private readonly apiService: ApiService,
        private readonly i18nService: I18nService,
        private readonly dialogService: XcDialogService,
        private readonly cdr: ChangeDetectorRef) {
        super(injector);
        this.refresh();
    }

    refresh() {
        this.busy = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.FILTER_INSTANCE_DETAIL, this.injectedData.filterinstance, XoFilterInstanceDetails, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (!result.errorMessage) {
                        this.detail = result.output[0] as XoFilterInstanceDetails;
                    } else {
                        this.dialogService.error(result.errorMessage);
                    }
                },
                error: err => {
                    this.dialogService.error(err);
                },
                complete: () => {
                    this.busy = false;
                    this.cdr.markForCheck();
                }
            });
    }

    enable() {
        this.busy = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.ENABLE_FILTER, this.injectedData.filterinstance, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (!result.errorMessage) {
                        this.injectedData.refresh();
                    } else {
                        this.dialogService.error(result.errorMessage);
                    }
                },
                error: err => {
                    this.dialogService.error(err);
                },
                complete: () => {
                    this.busy = false;
                    this.cdr.markForCheck();
                }
            });
    }

    disable() {
        this.busy = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.DISABLE_FILTER, this.injectedData.filterinstance, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (!result.errorMessage) {
                        this.injectedData.refresh();
                    } else {
                        this.dialogService.error(result.errorMessage);
                    }
                },
                error: err => {
                    this.dialogService.error(err);
                },
                complete: () => {
                    this.busy = false;
                    this.cdr.markForCheck();
                }
            });
    }

    undeploy() {
        this.dialogService.confirm(this.i18nService.translate('fman.taf.filter.tile.undeploy.confirm-title'), this.i18nService.translate('fman.taf.filter.tile.undeploy.confirm-message')).afterDismiss()
            .pipe(filter(res => !!res)).subscribe({
                next: () => {
                    this.busy = true;
                    this.apiService.startOrder(FM_RTC, ORDER_TYPES.UNDEPLOY_FILTER, this.injectedData.filterinstance, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
                        .subscribe({
                            next: result => {
                                if (!result.errorMessage) {
                                    this.injectedData.refresh();
                                } else {
                                    this.dialogService.error(result.errorMessage);
                                }
                            },
                            error: err => {
                                this.dialogService.error(err);
                            },
                            complete: () => {
                                this.busy = false;
                                this.cdr.markForCheck();
                            }
                        });
                }
            });
    }

    get triggerName(): string {
        return this.detail.triggerInstanceDetail.trigger;
    }

    get filterName(): string {
        return this.detail.filter;
    }

    get triggerInstanceName(): string {
        return this.detail.triggerInstanceDetail.triggerInstance;
    }

    get instanceName(): string {
        return this.detail.instance;
    }

    get triggerDescription(): string {
        return this.detail.triggerInstanceDetail.description;
    }

    get description(): string {
        return this.detail.description;
    }

    get triggerRuntimeContext(): string {
        return this.detail.triggerInstanceDetail.runtimeContext.label;
    }

    get runtimeContext(): string {
        return this.detail.runtimeContext.label;
    }

    get triggerStartParameter(): string {
        return this.detail.triggerInstanceDetail.startParameter;
    }

    get configParameter(): string {
        return this.detail.configurationParameter;
    }
}
