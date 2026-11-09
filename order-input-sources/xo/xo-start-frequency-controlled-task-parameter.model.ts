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
import { XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoOrderInputSource } from './xo-order-input-source.model';


@XoObjectClass(null, 'xmcp.factorymanager.orderinputsources', 'StartFrequencyControlledTaskParameter')
export class XoStartFrequencyControlledTaskParameter extends XoObject {

    @XoProperty()
    name: string;

    @XoProperty()
    numberOfOrders: number;

    @XoProperty()
    value: number;

    @XoProperty()
    createInputOnce: boolean;

    @XoProperty()
    dataPointCount: number;

    @XoProperty()
    dataPointDistance: number;

    @XoProperty()
    type: string;

    @XoProperty(XoOrderInputSource)
    orderInputSource: XoOrderInputSource = new XoOrderInputSource();

    @XoProperty()
    timezone: string;

    @XoProperty()
    delay: string;

}
