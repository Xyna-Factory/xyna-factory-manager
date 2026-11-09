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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';
import { XcComponentTemplate, XcTemplate, XoTableColumn, XoTableInfo } from '@zeta/xc';

import { XoOrderCustoms } from '../../xo/xo-ordercustoms.model';
import { XoOrderDestination } from '../../xo/xo-orderdestination.model';
import { XoOrderExecutionTime } from '../../xo/xo-orderexecutiontime.model';
import { CronlikeOrderIntervalTemplateComponent, CronlikeOrderIntervalTemplateData } from '../templates/cronlike-order-interval-template.component';


@XoObjectClass(null, 'xmcp.factorymanager.cronlikeorders', 'CronLikeOrder')
export class XoCronLikeOrder extends XoObject {
    @XoProperty()
    iD: number;

    @XoProperty()
    nextExecutionTime: number;

    @XoProperty()
    status: string;

    @XoProperty()
    errorMessage: string;

    @XoProperty()
    name: string;

    @XoProperty()
    onerror: string;

    @XoProperty()
    application: string;

    @XoProperty()
    version: string;

    @XoProperty()
    workspace: string;

    @XoProperty()
    enabled: boolean;

    @XoProperty()
    payload: string;

    @XoProperty(XoOrderCustoms)
    cronLikeOrderCustoms: XoOrderCustoms = new XoOrderCustoms();

    @XoProperty(XoOrderDestination)
    destination: XoOrderDestination = new XoOrderDestination();

    @XoProperty(XoOrderExecutionTime)
    executionTime: XoOrderExecutionTime = new XoOrderExecutionTime();

    @XoProperty()
    interval: string;

    @XoProperty()
    @XoTransient()
    cronlikeOrderIntervalTemplate: XcTemplate[] = [];

    afterDecode() {
        const data: CronlikeOrderIntervalTemplateData = {
            executionTime: this.executionTime
        };
        this.cronlikeOrderIntervalTemplate = [
            new XcComponentTemplate(CronlikeOrderIntervalTemplateComponent, data)
        ];
    }
}

@XoArrayClass(XoCronLikeOrder)
export class XoCronLikeOrderArray extends XoArray<XoCronLikeOrder> { }


export class CronlikeOrderTableInfo extends XoTableInfo {

    beforeEncode() {
        // deleting the extra column
        if (this.columns) {
            this.columns.data.splice(this.columns.length - 2, 1);
        }

    }

    afterDecode() {
        const column = new XoTableColumn();
        column.name = 'Interval';
        column.path = 'cronlikeOrderIntervalTemplate';
        column.disableFilter = true;
        column.disableSort = true;
        this.columns.data.splice(this.columns.length - 1, 0, column);
    }
}
