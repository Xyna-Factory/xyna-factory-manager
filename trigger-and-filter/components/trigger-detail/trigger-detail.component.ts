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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, InjectionToken } from '@angular/core';

import { FM_RTC } from '@fman/const';
import { XoRuntimeApplication } from '@fman/runtime-contexts/xo/xo-runtime-application.model';
import { XoWorkspace } from '@fman/runtime-contexts/xo/xo-workspace.model';
import { ORDER_TYPES } from '@fman/trigger-and-filter/order-types';
import { XoGetTriggerRequest } from '@fman/trigger-and-filter/xo/xo-get-trigger-request.model';
import { XoStartParameterDetails, XoStartParameterDetailsArray } from '@fman/trigger-and-filter/xo/xo-start-parameter-details.model';
import { XoTriggerDetail } from '@fman/trigger-and-filter/xo/xo-trigger-detail.model';
import { XoTrigger } from '@fman/trigger-and-filter/xo/xo-trigger.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nModule } from '@zeta/i18n/i18n.module';
import { XC_COMPONENT_DATA, XcDialogService, XcDynamicComponent } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { StartParameterDetailComponent } from '../start-parameter-deatil/start-parameter-detail.component';


@Component({
    selector: 'trigger-detail',
    templateUrl: './trigger-detail.component.html',
    styleUrls: ['./trigger-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcModule, I18nModule, StartParameterDetailComponent]
})
export class TriggerDetailComponent extends XcDynamicComponent<XoTrigger> {
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);
    private readonly cdr = inject(ChangeDetectorRef);


    startParameter: XoStartParameterDetails[];

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }

    detail: XoTriggerDetail;
    busy = false;

    constructor() {
        super();
        this.getStartParameter();
        this.refresh();
    }

    getStartParameter() {
        this.apiService.startOrderAssertFlat<XoStartParameterDetails>(FM_RTC, ORDER_TYPES.POSSIBLE_START_PARAMETER_TRIGGER, this.injectedData, XoStartParameterDetailsArray).subscribe({
            next: result => {
                this.startParameter = result;
                this.cdr.markForCheck();
            },
            error: err => {
                this.dialogService.error(err);
            }
        });
    }

    refresh() {
        this.busy = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.TRIGGER_DETAIL, this.buildRequest(this.injectedData), XoTriggerDetail, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (!result.errorMessage) {
                        this.detail = result.output[0] as XoTriggerDetail;
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

    get name(): string {
        if (!this.detail) {
            return undefined;
        }
        return this.detail.name;
    }

    get runtimeContextTitle(): string {
        if (!this.detail) {
            return undefined;
        }
        if (this.detail.runtimeContext instanceof XoRuntimeApplication) {
            return 'Application';
        }
        if (this.detail.runtimeContext instanceof XoWorkspace) {
            return 'Workspace';
        }
        return '';
    }

    get runtimeContextLabel(): string {
        if (!this.detail) {
            return undefined;
        }
        return this.detail.runtimeContext.label;
    }

    get description(): string {
        return this.detail.description;
    }

    private buildRequest(trigger: XoTrigger): XoGetTriggerRequest {
        const result: XoGetTriggerRequest = new XoGetTriggerRequest();
        result.trigger = trigger.name;
        result.runtimeContext = trigger.runtimeContext;
        return result;
    }
}
