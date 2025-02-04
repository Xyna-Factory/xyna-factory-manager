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
import { ChangeDetectorRef, Component, InjectionToken, Injector } from '@angular/core';

import { FM_RTC } from '@fman/const';
import { XoRuntimeApplication } from '@fman/runtime-contexts/xo/xo-runtime-application.model';
import { XoWorkspace } from '@fman/runtime-contexts/xo/xo-workspace.model';
import { ORDER_TYPES } from '@fman/trigger-and-filter/order-types';
import { XoFilterDetails } from '@fman/trigger-and-filter/xo/xo-filter-details.model';
import { XoFilter } from '@fman/trigger-and-filter/xo/xo-filter.model';
import { XoGetFilterDetailRequest } from '@fman/trigger-and-filter/xo/xo-get-filter-detail-request.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XC_COMPONENT_DATA, XcDialogService, XcDynamicComponent } from '@zeta/xc';


@Component({
    selector: 'filter-detail',
    templateUrl: './filter-detail.component.html',
    styleUrls: ['./filter-detail.component.scss']
})
export class FilterDetailComponent extends XcDynamicComponent<XoFilter> {


    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }

    detail: XoFilterDetails;
    busy = false;

    constructor(injector: Injector, private readonly apiService: ApiService, private readonly i18nService: I18nService, private readonly dialogService: XcDialogService, private readonly cdr: ChangeDetectorRef) {
        super(injector);
        this.refresh();
    }

    refresh() {
        this.busy = true;
        this.apiService.startOrder(FM_RTC, ORDER_TYPES.FILTER_DETAIL, this.buildRequest(this.injectedData), XoFilterDetails, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (!result.errorMessage) {
                        this.detail = result.output[0] as XoFilterDetails;
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

    private buildRequest(filter: XoFilter): XoGetFilterDetailRequest {
        const result: XoGetFilterDetailRequest = new XoGetFilterDetailRequest();
        result.filter = filter.name;
        result.runtimeContext = filter.runtimeContext;
        return result;
    }
}
