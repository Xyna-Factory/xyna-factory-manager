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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoOrderCustoms } from '../../xo/xo-ordercustoms.model';
import { XoOrderDestination } from '../../xo/xo-orderdestination.model';
import { XoOrderExecutionTime } from '../../xo/xo-orderexecutiontime.model';
import { XoTCOExecutionRestriction } from './xo-tcoexecution-restriction.model';
import { XoTimeControlledOrderId } from './xo-time-controlled-order-id.model';


@XoObjectClass(null, 'xmcp.factorymanager.timecontrolledorders', 'TimeControlledOrder')
export class XoTimeControlledOrder extends XoObject {
    @XoProperty(XoTimeControlledOrderId)
    id: XoTimeControlledOrderId = new XoTimeControlledOrderId();

    @XoProperty()
    name: string;

    @XoProperty()
    enabled: boolean;

    @XoProperty(XoOrderDestination)
    orderDestination: XoOrderDestination = new XoOrderDestination();

    @XoProperty()
    inputPayload: string;

    @XoProperty(XoOrderExecutionTime)
    planningHorizon: XoOrderExecutionTime = new XoOrderExecutionTime();

    @XoProperty(XoTCOExecutionRestriction)
    tCOExecutionRestriction: XoTCOExecutionRestriction = new XoTCOExecutionRestriction();

    @XoProperty(XoOrderCustoms)
    orderCustoms: XoOrderCustoms = new XoOrderCustoms();

    @XoProperty()
    filterCriteria: string;

    @XoProperty()
    storableFqn: string;

    @XoProperty()
    sortCriteria: string;

    @XoProperty()
    archived: boolean;

    afterDecode() {
        super.afterDecode();
        // Deletes the timeWindow if not filled with data because decoding will generate an empty object.
        if (Object.entries(this.planningHorizon.timeWindow.data).length === 0) {
            this.planningHorizon.timeWindow = null;
        }
    }
}

@XoArrayClass(XoTimeControlledOrder)
export class XoTimeControlledOrderArray extends XoArray<XoTimeControlledOrder> {}
