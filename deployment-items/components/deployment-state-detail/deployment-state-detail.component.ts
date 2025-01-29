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
import { Component, Input } from '@angular/core';

import { dateTimeString } from '@zeta/base';
import { XcDialogService } from '@zeta/xc';

import { XoDeploymentItem } from '../../xo/xo-deployment-item.model';


@Component({
    selector: 'deployment-state-detail',
    templateUrl: './deployment-state-detail.component.html',
    styleUrls: ['./deployment-state-detail.component.scss'],
    standalone: false
})
export class DeploymentStateDetailComponent {
    private _deploymentItem: XoDeploymentItem;

    constructor(private readonly dialogService: XcDialogService) {
    }


    @Input()
    set deploymentItem(value: XoDeploymentItem) {
        this._deploymentItem = value;
    }


    get deploymentItem(): XoDeploymentItem {
        return this._deploymentItem;
    }


    get detailsLastStateChange(): string {
        return dateTimeString(this.deploymentItem.lastStateChange, false);
    }


    get detailsLastModified(): string {
        return dateTimeString(this.deploymentItem.lastModified, false);
    }


    openErrorDetails() {
        this.dialogService.error(this.deploymentItem.rollbackCause.message, 'Error', this.deploymentItem.rollbackCause.stacktrace);
    }
}
