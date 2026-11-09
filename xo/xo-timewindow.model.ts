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
import { XoObjectClass, XoArrayClass, XoObject, XoArray, XoProperty } from '@zeta/api';
import { XoTimeUnitArray } from './xo-timeunit.model';

// Base and its children written in one file so that the compiler won't throw out the former
// files, in which every child was written

@XoObjectClass(null, 'xmcp.factorymanager.shared', 'TimeWindow')
export class XoTimeWindow extends XoObject {}

@XoArrayClass(XoTimeWindow)
export class XoTimeWindowArray extends XoArray<XoTimeWindow> {}


@XoObjectClass(XoTimeWindow, 'xmcp.factorymanager.shared', 'SimpleTimeWindow')
export class XoSimpleTimeWindow extends XoTimeWindow {
    @XoProperty()
    stringRepresentation: string;

    @XoProperty()
    duration: string;
}

@XoArrayClass(XoSimpleTimeWindow)
export class XoSimpleTimeWindowArray extends XoArray<XoSimpleTimeWindow> {}


@XoObjectClass(XoTimeWindow, 'xmcp.factorymanager.shared', 'MultiTimeWindow')
export class XoMultiTimeWindow extends XoTimeWindow {
    @XoProperty(XoTimeWindowArray)
    subWindowDefinitions: XoTimeWindowArray = new XoTimeWindowArray();
}

@XoArrayClass(XoMultiTimeWindow)
export class XoMultiTimeWindowArray extends XoArray<XoMultiTimeWindow> {}


@XoObjectClass(XoTimeWindow, 'xmcp.factorymanager.shared', 'RestrictionBasedTimeWindow')
export class XoRestrictionBasedTimeWindow extends XoTimeWindow {
    @XoProperty(XoTimeUnitArray)
    duration: XoTimeUnitArray = new XoTimeUnitArray();

    @XoProperty(XoTimeUnitArray)
    restriction: XoTimeUnitArray = new XoTimeUnitArray();
}

@XoArrayClass(XoRestrictionBasedTimeWindow)
export class XoRestrictionBasedTimeWindowArray extends XoArray<XoRestrictionBasedTimeWindow> {}
