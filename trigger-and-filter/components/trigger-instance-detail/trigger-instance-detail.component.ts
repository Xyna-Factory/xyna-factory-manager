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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, InjectionToken, Injector } from '@angular/core';

import { FM_RTC } from '@fman/const';
import { ORDER_TYPES } from '@fman/trigger-and-filter/order-types';
import { XoFilterInstance } from '@fman/trigger-and-filter/xo/xo-filter-instance.model';
import { XoTriggerInstanceDetail } from '@fman/trigger-and-filter/xo/xo-trigger-instance-detail.model';
import { XoTriggerInstance } from '@fman/trigger-and-filter/xo/xo-trigger-instance.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { Comparable } from '@zeta/base';
import { I18nService } from '@zeta/i18n';
import { I18nModule } from '@zeta/i18n/i18n.module';
import { XC_COMPONENT_DATA, XcDialogService, XcDynamicComponent, XcLocalTableDataSource, XDSIconName } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { filter } from 'rxjs';


export interface TriggerInstanceDetailsData {
    triggerinstance: XoTriggerInstance;
    refresh: () => void;
}

class FilterInstanceData extends Comparable {

    constructor(public filterName: string, public instance: string, public context: string) {
        super();
    }

    get uniqueKey(): string {
        return ':instance:' + this.instance + ':rtc:' + this.context;
    }
}

@Component({
    templateUrl: './trigger-instance-detail.component.html',
    styleUrls: ['./trigger-instance-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcModule, I18nModule]
})
export class TriggerInstanceDetailComponent extends XcDynamicComponent<TriggerInstanceDetailsData> {
    private readonly apiService = inject(ApiService);
    private readonly i18nService = inject(I18nService);
    private readonly dialogService = inject(XcDialogService);
    private readonly cdr = inject(ChangeDetectorRef);


    readonly XDSIconName = XDSIconName;

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }

    detail: XoTriggerInstanceDetail = new XoTriggerInstanceDetail();
    datasource: XcLocalTableDataSource<FilterInstanceData> = new XcLocalTableDataSource<FilterInstanceData>(this.i18nService);
    busy = false;

    constructor() {
        super();
        this.refresh();
    }

    refresh() {
        this.busy = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.TRIGGER_INSTANCE_DETAIL, this.injectedData.triggerinstance, XoTriggerInstanceDetail, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (!result.errorMessage) {
                        this.detail = result.output[0] as XoTriggerInstanceDetail;
                        this.fillDatasource(this.detail.filterInstance.data);
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
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.ENABLE_TRIGGER, this.injectedData.triggerinstance, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
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
                complete: () => this.busy = false
            });
    }

    disable() {
        this.busy = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.DISABLE_TRIGGER, this.injectedData.triggerinstance, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
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
                complete: () => this.busy = false
            });
    }

    undeploy() {
        this.dialogService.confirm(this.i18nService.translate('fman.taf.trigger.tile.undeploy.confirm-title'), this.i18nService.translate('fman.taf.trigger.tile.undeploy.confirm-message')).afterDismiss()
            .pipe(filter(res => !!res)).subscribe({
                next: () => {
                    this.busy = true;
                    this.apiService.startOrder(FM_RTC, ORDER_TYPES.UNDEPLOY_TRIGGER, this.injectedData.triggerinstance, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
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
                            complete: () => this.busy = false
                        });
                }
            });
    }

    private fillDatasource(data: XoFilterInstance[]) {
        this.datasource.localTableData = {
            columns: [
                { path: 'filterName', name: 'fman.taf.trigger.tile.table.filter' },
                { path: 'instance', name: 'fman.taf.trigger.tile.table.instance' },
                { path: 'context', name: 'fman.taf.trigger.tile.table.context' }
            ],
            rows: data.map(xo => new FilterInstanceData(xo.filter, xo.filterInstance, xo.runtimeContext.label))
        };
        this.datasource.refresh();
        this.cdr.markForCheck();
    }

    get triggerName(): string {
        return this.detail.trigger;
    }

    get triggerInstanceName(): string {
        return this.detail.triggerInstance;
    }

    get triggerDescription(): string {
        return this.detail.description;
    }

    get triggerRuntimeContext(): string {
        return this.detail.runtimeContext.label;
    }

    get triggerStartParameter(): string {
        return this.detail.startParameter;
    }
}
