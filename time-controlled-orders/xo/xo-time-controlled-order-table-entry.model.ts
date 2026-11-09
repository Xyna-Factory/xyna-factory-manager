// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoTransient, XoUnique } from '@zeta/api';
import { XcComponentTemplate, XcTemplate } from '@zeta/xc';

import { XoOrderDestination } from '../../xo/xo-orderdestination.model';
import { TimeControlledOrderTableEntryTemplateComponent } from '../template/time-controlled-order-table-entry-template/time-controlled-order-table-entry-template.component';
import { XoTimeControlledOrderId } from './xo-time-controlled-order-id.model';


export interface TimeControlledOrderTableEntryTemplateData {
    id: string;
    archived: boolean;
}

@XoObjectClass(null, 'xmcp.factorymanager.timecontrolledorders', 'TimeControlledOrderTableEntry')
export class XoTimeControlledOrderTableEntry extends XoObject {
    @XoProperty(XoTimeControlledOrderId)
    id: XoTimeControlledOrderId = new XoTimeControlledOrderId();

    @XoProperty()
    name: string;

    @XoProperty()
    application: string;

    @XoProperty()
    version: string;

    @XoProperty()
    workspace: string;

    @XoProperty(XoOrderDestination)
    orderDestination: XoOrderDestination = new XoOrderDestination();

    @XoProperty()
    startTime: string;

    @XoProperty()
    interval: string;

    @XoProperty()
    status: string;

    @XoProperty()
    archived: boolean;

    @XoProperty()
    @XoTransient()
    tableArchivedTemplate: XcTemplate[];

    @XoProperty()
    @XoTransient()
    @XoUnique()
    uniqueId: number;

    afterDecode() {
        super.afterDecode();
        const data: TimeControlledOrderTableEntryTemplateData = {
            id: this.id.id.toString(),
            archived: this.archived
        };
        this.tableArchivedTemplate = [new XcComponentTemplate(TimeControlledOrderTableEntryTemplateComponent, data)];

        /** This is only for the restorable route component. There needs to be a root level unique identifiert. */
        this.uniqueId = this.id.id;
    }
}

@XoArrayClass(XoTimeControlledOrderTableEntry)
export class XoTimeControlledOrderTableEntryArray extends XoArray<XoTimeControlledOrderTableEntry> {}
