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
import { Component, HostBinding, HostListener, Injector } from '@angular/core';

import { XcAutocompleteDataWrapper, XcRichListItemComponent } from '@zeta/xc';

import { Subject } from 'rxjs';

import { DeleteDeploymentItemResolution } from '../../../restorable-deployment-items.component';
import { XoDeleteDeploymentItemResult } from '../../../xo/xo-delete-deployment-item-result.model';


export interface DeleteReportItemComponentData {
    result: XoDeleteDeploymentItemResult;
    resolution: string;
    selectedResultSubject: Subject<XoDeleteDeploymentItemResult>;
    isResultSelected: () => boolean;
}

@Component({
    templateUrl: './delete-report-item.component.html',
    styleUrls: ['./delete-report-item.component.scss'],
    standalone: false
})
export class DeleteReportItemComponent extends XcRichListItemComponent<void, DeleteReportItemComponentData> {

    resolutionDataWrapper: XcAutocompleteDataWrapper;

    constructor(injector: Injector) {
        super(injector);
        this.resolutionDataWrapper = new XcAutocompleteDataWrapper(
            () => this.injectedData.resolution,
            (value: string) => this.injectedData.resolution = value
        );
        const values = Object.keys(DeleteDeploymentItemResolution).map(key => DeleteDeploymentItemResolution[key]);
        this.resolutionDataWrapper.values = values.map(val => ({name: val, value: val}));
    }

    focus() {
        this.onclick({} as MouseEvent);
    }

    @HostListener('click', ['$event'])
    onclick(event: MouseEvent) {
        this.injectedData.selectedResultSubject.next(this.injectedData.result);
    }

    @HostBinding('class.selected')
    get isSelected(): boolean {
        return this.injectedData.isResultSelected ? this.injectedData.isResultSelected() : false;
    }
}
