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
import { Component } from '@angular/core';
import { FrequencyControlledTaskPreset, OrderInputSourceCloseEvent } from '../../order-input-source-details/order-input-source-details.component';

import { XcDialogComponent } from '@zeta/xc';
import { XoOrderInputSource } from '../../xo/xo-order-input-source.model';


export interface OrderInputSourceDetailsModalComponentData {
    orderInputSource: XoOrderInputSource;
    fctPreset: FrequencyControlledTaskPreset;
}


@Component({
    templateUrl: './order-input-source-details-modal.component.html',
    styleUrls: ['./order-input-source-details-modal.component.scss'],
    standalone: false
})
export class OrderInputSourceDetailsModalComponent extends XcDialogComponent<boolean, OrderInputSourceDetailsModalComponentData> {
    close(event?: OrderInputSourceCloseEvent) {
        this.dismiss(event?.dataChanged || false);
    }
}
